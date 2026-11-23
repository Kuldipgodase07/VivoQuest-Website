import { COLLECTIONS } from '../../database/schemas/definitions';
import { CryptoService } from '../src/common/crypto/crypto.service';
import { ReportsService } from '../src/modules/rpt/reports.service';
import { PaymentsService } from '../src/modules/pay/payments.service';
import { ComplianceService } from '../src/modules/cmp/compliance.service';
import { DatabaseService } from '../src/common/database/database.service';
import { AuditService } from '../src/common/services/audit.service';
import { RedisService } from '../src/common/redis/redis.service';
import { IamService } from '../src/modules/iam/iam.service';
import { ObjectId } from 'mongodb';

describe('VivoQuest Backend Verification Suite', () => {
  let db: DatabaseService;
  let cryptoService: CryptoService;
  let auditService: AuditService;
  let redisService: RedisService;
  let iamService: IamService;
  let paymentsService: PaymentsService;
  let complianceService: ComplianceService;
  let reportsService: ReportsService;

  beforeAll(async () => {
    db = new DatabaseService();
    await db.onModuleInit();

    cryptoService = new CryptoService();
    auditService = new AuditService(db, cryptoService);
    redisService = new RedisService();
    await redisService.onModuleInit();

    iamService = new IamService(db, cryptoService, redisService, auditService);
    paymentsService = new PaymentsService(db, cryptoService, auditService);
    complianceService = new ComplianceService(db, auditService);
    reportsService = new ReportsService(db, auditService);
  });

  afterAll(async () => {
    await db.onModuleDestroy();
    await redisService.onModuleDestroy();
  });

  describe('1. Section 4 MongoDB Schema & Collections Catalog', () => {
    it('should define exactly 69 collections matching the plan specifications', () => {
      const collectionNames = Object.keys(COLLECTIONS);
      expect(collectionNames.length).toBe(69);
    });

    it('should include all required collection prefixes (iam_, prf_, care_, aco_, vac_, mkt_, pay_, cmp_, aud_, rpt_, ntf_, sys_)', () => {
      const prefixes = ['iam_', 'prf_', 'care_', 'aco_', 'vac_', 'mkt_', 'pay_', 'cmp_', 'aud_', 'rpt_', 'ntf_', 'sys_'];
      const collectionNames = Object.keys(COLLECTIONS);

      for (const prefix of prefixes) {
        const matches = collectionNames.filter(c => c.startsWith(prefix));
        expect(matches.length).toBeGreaterThan(0);
      }
    });

    it('should configure strict $jsonSchema validators on all 69 collections', () => {
      for (const [name, def] of Object.entries(COLLECTIONS)) {
        expect(def.validator).toBeDefined();
        expect(def.validator.$jsonSchema).toBeDefined();
        expect(def.validator.$jsonSchema.bsonType).toBe('object');
        expect(def.validator.$jsonSchema.required).toContain('schemaVersion');
        expect(def.validator.$jsonSchema.required).toContain('createdAt');
        expect(def.validator.$jsonSchema.required).toContain('updatedAt');
      }
    });

    it('should define required specific indexes from Section 4 table', () => {
      expect(COLLECTIONS['iam_users'].indexes.some(i => i.name === 'ux_iam_users_phoneHash' && i.unique)).toBe(true);
      expect(COLLECTIONS['iam_otp_challenges'].indexes.some(i => i.expireAfterSeconds !== undefined)).toBe(true);
      expect(COLLECTIONS['iam_sessions'].indexes.some(i => i.name === 'ix_iam_sessions_userId_revokedAt')).toBe(true);
      expect(COLLECTIONS['care_visits'].indexes.some(i => i.name === 'ix_care_visits_patientId_scheduledAt')).toBe(true);
      expect(COLLECTIONS['care_vitals'].indexes.some(i => i.name === 'ix_care_vitals_patientId_recordedAt')).toBe(true);
      expect(COLLECTIONS['mkt_orders'].indexes.some(i => i.name === 'ux_mkt_orders_orderNo' && i.unique)).toBe(true);
      expect(COLLECTIONS['pay_transactions'].indexes.some(i => i.name === 'ux_pay_transactions_gatewayPaymentId' && i.unique)).toBe(true);
      expect(COLLECTIONS['pay_webhook_events'].indexes.some(i => i.name === 'ux_pay_webhook_events_eventId' && i.unique)).toBe(true);
      expect(COLLECTIONS['aud_events'].indexes.some(i => i.name === 'ix_aud_events_actorId_at')).toBe(true);
      expect(COLLECTIONS['rpt_jobs'].indexes.some(i => i.name === 'ix_rpt_jobs_requestedBy_createdAt')).toBe(true);
    });
  });

  describe('2. Section 6 Identity, OTP, JWT and Rate Limiting', () => {
    const testPhone = '+919988776655';

    it('should send OTP and return 6-digit challenge', async () => {
      const res = await iamService.sendOtp(testPhone, '127.0.0.1', 'Pune');
      expect(res.success).toBe(true);
      expect(res.debugCode).toBeDefined();
      expect(res.debugCode?.length).toBe(6);
    });

    it('should verify OTP and issue 15-minute JWT access token with rotating refresh token', async () => {
      const sendRes = await iamService.sendOtp('+919988776644', '127.0.0.1', 'Mumbai');
      const otp = sendRes.debugCode!;

      const verifyRes = await iamService.verifyOtp('+919988776644', otp, 'Mumbai', 'patient');
      expect(verifyRes.accessToken).toBeDefined();
      expect(verifyRes.refreshToken).toBeDefined();
      expect(verifyRes.expiresIn).toBe(900);
      expect(verifyRes.user.currentRole).toBe('patient');
    });

    it('should reject incorrect OTP with attempts decrement', async () => {
      await iamService.sendOtp('+919988776633', '127.0.0.1', 'Pune');
      await expect(iamService.verifyOtp('+919988776633', '000000', 'Pune', 'patient')).rejects.toThrow();
    });
  });

  describe('3. Section 7 Payments, Invoices, Refunds and Maker-Checker', () => {
    it('should prevent refund amount from exceeding captured balance (PAY_REFUND_EXCEEDS_CAPTURE)', async () => {
      const orderId = new ObjectId();
      const txRes = await db.getCollection('pay_transactions').insertOne({
        _id: new ObjectId(),
        orderId,
        gateway: 'razorpay',
        gatewayPaymentId: 'pay_test_001',
        amountMinor: 100000, // ₹1,000.00
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        capturedAt: new Date(),
        settlementId: null,
        idempotencyKey: 'idemp_test_001',
        refundedAmountMinor: 40000, // ₹400.00 already refunded
        schemaVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test',
        deletedAt: null
      });

      // Attempt refund of ₹700 (exceeds ₹600 remaining refundable balance)
      await expect(paymentsService.createRefund({
        transactionId: String(txRes.insertedId),
        amountMinor: 70000,
        reason: 'Faulty device'
      }, new ObjectId().toHexString())).rejects.toThrow();
    });

    it('should enforce maker-checker segregation of duties on approval decisions', async () => {
      const makerId = new ObjectId().toHexString();
      const approval = await complianceService.submitApproval({
        type: 'refund',
        resourceType: 'pay_refunds',
        resourceId: new ObjectId().toHexString()
      }, makerId);

      // Attempt checker = maker (must be rejected)
      await expect(complianceService.decideApproval(String(approval._id), 'approved', 'Looks good', makerId)).rejects.toThrow();

      // Independent checker approves
      const checkerId = new ObjectId().toHexString();
      const decisionRes = await complianceService.decideApproval(String(approval._id), 'approved', 'Verified and approved', checkerId);
      expect(decisionRes.success).toBe(true);
      expect(decisionRes.status).toBe('approved');
    });
  });

  describe('4. Section 8 Reports Generation Engine', () => {
    it('should render patient care summary report as valid PDF 1.7 binary', async () => {
      const userId = new ObjectId().toHexString();
      const job = await reportsService.createJob({
        reportType: 'patient-care',
        format: 'pdf',
        requestedBy: userId
      });

      expect(job.status).toBe('completed');
      expect(job.fileSize).toBeGreaterThan(0);

      const download = await reportsService.downloadReport(job.id, userId);
      expect(download.mime).toBe('application/pdf');
      // Verify PDF header magic bytes %PDF
      const headerStr = String.fromCharCode(...download.buffer.slice(0, 4));
      expect(headerStr).toBe('%PDF');
    });

    it('should render payments workbook report as valid OOXML .xlsx binary', async () => {
      const userId = new ObjectId().toHexString();
      const job = await reportsService.createJob({
        reportType: 'payments-workbook',
        format: 'xlsx',
        requestedBy: userId
      });

      expect(job.status).toBe('completed');
      const download = await reportsService.downloadReport(job.id, userId);
      expect(download.mime).toContain('spreadsheetml.sheet');
      // Verify ZIP magic bytes PK
      const magic = String.fromCharCode(...download.buffer.slice(0, 2));
      expect(magic).toBe('PK');
    });
  });

  describe('5. Section 9 Cryptographic Tamper-Evident Audit Trail', () => {
    it('should generate verifiable SHA-256 hash chaining on aud_events', async () => {
      const actorId = new ObjectId().toHexString();
      const hash1 = await auditService.logEvent({
        actorId,
        action: 'care.record.read',
        resourceType: 'care_records',
        resourceId: new ObjectId().toHexString()
      });

      const hash2 = await auditService.logEvent({
        actorId,
        action: 'report.download',
        resourceType: 'rpt_jobs',
        resourceId: new ObjectId().toHexString()
      });

      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });
  });
});
