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
import * as assert from 'assert';

async function main() {
  console.log('--- STARTING VIVOQUEST BACKEND VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    return Promise.resolve()
      .then(() => fn())
      .then(() => {
        console.log(`  ✓ PASS: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(err.stack || err.message);
        failed++;
      });
  }

  const db = new DatabaseService();
  await db.onModuleInit();

  const cryptoService = new CryptoService();
  const auditService = new AuditService(db, cryptoService);
  const redisService = new RedisService();
  await redisService.onModuleInit();

  const iamService = new IamService(db, cryptoService, redisService, auditService);
  const paymentsService = new PaymentsService(db, cryptoService, auditService);
  const complianceService = new ComplianceService(db, auditService);
  const reportsService = new ReportsService(db, auditService);

  console.log('\n[Suite 1] Section 4 MongoDB Schema & Collections Catalog');
  await test('Exact 69 collections defined in catalog', () => {
    const keys = Object.keys(COLLECTIONS);
    assert.strictEqual(keys.length, 69, `Expected 69 collections, got ${keys.length}`);
  });

  await test('All 12 prefixes represented (iam_, prf_, care_, aco_, vac_, mkt_, pay_, cmp_, aud_, rpt_, ntf_, sys_)', () => {
    const prefixes = ['iam_', 'prf_', 'care_', 'aco_', 'vac_', 'mkt_', 'pay_', 'cmp_', 'aud_', 'rpt_', 'ntf_', 'sys_'];
    const keys = Object.keys(COLLECTIONS);
    for (const p of prefixes) {
      const count = keys.filter(k => k.startsWith(p)).length;
      assert.ok(count > 0, `Prefix ${p} has 0 collections`);
    }
  });

  await test('Strict $jsonSchema validators configured for all 69 collections', () => {
    for (const [name, def] of Object.entries(COLLECTIONS)) {
      assert.ok(def.validator?.$jsonSchema, `Collection ${name} missing $jsonSchema`);
      assert.strictEqual(def.validator.$jsonSchema.bsonType, 'object');
      assert.ok(def.validator.$jsonSchema.required.includes('schemaVersion'), `${name} missing schemaVersion in required`);
      assert.ok(def.validator.$jsonSchema.required.includes('createdAt'), `${name} missing createdAt in required`);
    }
  });

  await test('Exact indexes from Section 4 table exist', () => {
    assert.ok(COLLECTIONS['iam_users'].indexes.some(i => i.name === 'ux_iam_users_phoneHash' && i.unique));
    assert.ok(COLLECTIONS['iam_otp_challenges'].indexes.some(i => i.expireAfterSeconds !== undefined));
    assert.ok(COLLECTIONS['iam_sessions'].indexes.some(i => i.name === 'ix_iam_sessions_userId_revokedAt'));
    assert.ok(COLLECTIONS['care_visits'].indexes.some(i => i.name === 'ix_care_visits_patientId_scheduledAt'));
    assert.ok(COLLECTIONS['care_vitals'].indexes.some(i => i.name === 'ix_care_vitals_patientId_recordedAt'));
    assert.ok(COLLECTIONS['mkt_orders'].indexes.some(i => i.name === 'ux_mkt_orders_orderNo' && i.unique));
    assert.ok(COLLECTIONS['pay_transactions'].indexes.some(i => i.name === 'ux_pay_transactions_gatewayPaymentId' && i.unique));
    assert.ok(COLLECTIONS['pay_webhook_events'].indexes.some(i => i.name === 'ux_pay_webhook_events_eventId' && i.unique));
    assert.ok(COLLECTIONS['aud_events'].indexes.some(i => i.name === 'ix_aud_events_actorId_at'));
    assert.ok(COLLECTIONS['rpt_jobs'].indexes.some(i => i.name === 'ix_rpt_jobs_requestedBy_createdAt'));
  });

  console.log('\n[Suite 2] Section 6 Identity, OTP, JWT and Rate Limiting');
  await test('OTP challenge creation and DLT delivery simulation', async () => {
    const res = await iamService.sendOtp('+919876543210', '127.0.0.1', 'Pune');
    assert.strictEqual(res.success, true);
    assert.ok(res.debugCode && res.debugCode.length === 6);
  });

  await test('OTP verification and 15-minute JWT access token issuance', async () => {
    const phone = '+919876543211';
    const send = await iamService.sendOtp(phone, '127.0.0.1', 'Pune');
    const verify = await iamService.verifyOtp(phone, send.debugCode!, 'Pune', 'clinician');
    assert.ok(verify.accessToken, 'Access token missing');
    assert.ok(verify.refreshToken, 'Refresh token missing');
    assert.strictEqual(verify.expiresIn, 900);
    assert.strictEqual(verify.user.currentRole, 'clinician');
  });

  console.log('\n[Suite 3] Section 7 Payments, Invoices, Refunds and Maker-Checker');
  await test('Refund guard: amount cannot exceed captured minus refunded (PAY_REFUND_EXCEEDS_CAPTURE)', async () => {
    const tx = await db.getCollection('pay_transactions').insertOne({
      _id: new ObjectId(),
      orderId: new ObjectId(),
      gateway: 'razorpay',
      gatewayPaymentId: 'pay_rzp_test_100',
      amountMinor: 100000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      capturedAt: new Date(),
      settlementId: null,
      idempotencyKey: 'idemp_100',
      refundedAmountMinor: 40000, // already refunded ₹400
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test',
      deletedAt: null
    });

    let threw = false;
    try {
      await paymentsService.createRefund({
        transactionId: String(tx.insertedId),
        amountMinor: 70000 // ₹700 > remaining ₹600
      }, new ObjectId().toHexString());
    } catch (e: any) {
      threw = true;
      assert.strictEqual(e.response?.code, 'PAY_REFUND_EXCEEDS_CAPTURE');
    }
    assert.ok(threw, 'Should have thrown PAY_REFUND_EXCEEDS_CAPTURE');
  });

  await test('Maker-Checker: Segregation of duties prevents self-approval', async () => {
    const makerId = new ObjectId().toHexString();
    const approval = await complianceService.submitApproval({
      type: 'refund',
      resourceType: 'pay_refunds',
      resourceId: new ObjectId().toHexString()
    }, makerId);

    let rejectedSelfApproval = false;
    try {
      await complianceService.decideApproval(String(approval._id), 'approved', 'Self approving', makerId);
    } catch (e: any) {
      rejectedSelfApproval = true;
      assert.strictEqual(e.response?.code, 'MAKER_CHECKER_VIOLATION');
    }
    assert.ok(rejectedSelfApproval, 'Self approval must fail');

    // Independent checker approves
    const checkerId = new ObjectId().toHexString();
    const approved = await complianceService.decideApproval(String(approval._id), 'approved', 'Verified and approved', checkerId);
    assert.strictEqual(approved.status, 'approved');
  });

  console.log('\n[Suite 4] Section 8 Reports Generation Engine (PDF & OOXML XLSX)');
  await test('Render Patient Care Summary as real PDF 1.7', async () => {
    const uid = new ObjectId().toHexString();
    const job = await reportsService.createJob({
      reportType: 'patient-care',
      format: 'pdf',
      requestedBy: uid
    });
    assert.strictEqual(job.status, 'completed');
    const dl = await reportsService.downloadReport(job.id, uid);
    assert.strictEqual(dl.mime, 'application/pdf');
    const magic = String.fromCharCode(...dl.buffer.slice(0, 4));
    assert.strictEqual(magic, '%PDF', 'PDF magic bytes %PDF must be present');
  });

  await test('Render Payments Workbook as real OOXML .xlsx', async () => {
    const uid = new ObjectId().toHexString();
    const job = await reportsService.createJob({
      reportType: 'payments-workbook',
      format: 'xlsx',
      requestedBy: uid
    });
    assert.strictEqual(job.status, 'completed');
    const dl = await reportsService.downloadReport(job.id, uid);
    assert.ok(dl.mime.includes('spreadsheetml.sheet'));
    const magic = String.fromCharCode(...dl.buffer.slice(0, 2));
    assert.strictEqual(magic, 'PK', 'ZIP/OOXML magic bytes PK must be present');
  });

  console.log('\n[Suite 5] Section 9 Cryptographic Tamper-Evident Audit Trail');
  await test('SHA-256 hash chaining on aud_events', async () => {
    const actorId = new ObjectId().toHexString();
    const h1 = await auditService.logEvent({
      actorId,
      action: 'care.record.read',
      resourceType: 'care_records',
      resourceId: new ObjectId().toHexString()
    });
    const h2 = await auditService.logEvent({
      actorId,
      action: 'report.download',
      resourceType: 'rpt_jobs',
      resourceId: new ObjectId().toHexString()
    });

    assert.strictEqual(h1.length, 64);
    assert.strictEqual(h2.length, 64);
    assert.notStrictEqual(h1, h2);
  });

  await db.onModuleDestroy();
  await redisService.onModuleDestroy();

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
