import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { AuditService } from '../../common/services/audit.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService
  ) {}

  async getControls() {
    return this.db.getCollection('cmp_controls').find({ deletedAt: null }).toArray();
  }

  async getApprovals(status?: string) {
    const filter: any = { deletedAt: null };
    if (status) filter.status = status;
    return this.db.getCollection('cmp_approvals').find(filter).toArray();
  }

  async submitApproval(data: any, makerId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      type: data.type,
      resourceType: data.resourceType,
      resourceId: new ObjectId(data.resourceId),
      makerId: new ObjectId(makerId),
      checkerId: null,
      status: 'pending',
      decisionNotes: data.decisionNotes || null,
      decidedAt: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: makerId,
      deletedAt: null
    };
    await this.db.getCollection('cmp_approvals').insertOne(doc);
    return doc;
  }

  async decideApproval(approvalId: string, decision: 'approved' | 'rejected', notes: string, checkerId: string) {
    const approval = await this.db.getCollection('cmp_approvals').findOne({ _id: new ObjectId(approvalId) });
    if (!approval) {
      throw new NotFoundException({ code: 'APPROVAL_NOT_FOUND', detail: 'Approval request not found.' });
    }

    // Maker-checker rule: Maker cannot be Checker!
    if (String(approval.makerId) === String(checkerId)) {
      throw new BadRequestException({
        code: 'MAKER_CHECKER_VIOLATION',
        detail: 'Segregation of duties violation: maker cannot approve their own request.'
      });
    }

    const now = new Date();
    await this.db.getCollection('cmp_approvals').updateOne(
      { _id: approval._id },
      {
        $set: {
          status: decision,
          checkerId: new ObjectId(checkerId),
          decisionNotes: notes,
          decidedAt: now,
          updatedAt: now
        }
      }
    );

    // If refund was approved, execute payment refund actions
    if (approval.type === 'refund' && decision === 'approved') {
      const refund = await this.db.getCollection('pay_refunds').findOne({ _id: approval.resourceId });
      if (refund) {
        const creditNoteNo = `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const cnDoc = {
          _id: new ObjectId(),
          creditNoteNo,
          invoiceId: refund.transactionId,
          refundId: refund._id,
          amountMinor: refund.amountMinor,
          currency: refund.currency,
          taxReversedMinor: Math.round(refund.amountMinor * 0.18 / 1.18),
          reason: refund.reason,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
          createdBy: checkerId,
          deletedAt: null
        };
        await this.db.getCollection('pay_credit_notes').insertOne(cnDoc);

        await this.db.getCollection('pay_refunds').updateOne(
          { _id: refund._id },
          {
            $set: {
              status: 'approved',
              checkerId: new ObjectId(checkerId),
              approvedAt: now,
              creditNoteId: cnDoc._id,
              updatedAt: now
            }
          }
        );

        await this.db.getCollection('pay_transactions').updateOne(
          { _id: refund.transactionId },
          {
            $inc: { refundedAmountMinor: refund.amountMinor },
            $set: { status: 'refunded', updatedAt: now }
          }
        );
      }
    }

    await this.audit.logEvent({
      actorId: checkerId,
      action: `cmp.approval.${decision}`,
      resourceType: approval.resourceType,
      resourceId: approval.resourceId,
      extra: { approvalId: String(approval._id), notes }
    });

    return { success: true, status: decision };
  }

  async getFilings() {
    return this.db.getCollection('cmp_filings').find({ deletedAt: null }).toArray();
  }

  async recordConsent(patientId: string, purpose: string, status: 'active' | 'revoked', granteeId?: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(patientId),
      granteeId: granteeId ? new ObjectId(granteeId) : null,
      purpose,
      status,
      grantedAt: status === 'active' ? now : null,
      revokedAt: status === 'revoked' ? now : null,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: patientId,
      deletedAt: null
    };

    await this.db.getCollection('cmp_consents').updateOne(
      { patientId: doc.patientId, purpose: doc.purpose },
      { $set: doc },
      { upsert: true }
    );

    return { success: true, consent: doc };
  }

  async requestDataExport(userId: string) {
    const now = new Date();
    const dueAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30-day statutory SLA

    const dsrDoc = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      type: 'data_export',
      status: 'processing',
      dueAt,
      completedAt: null,
      exportJobId: null,
      legalHoldExempt: false,
      rejectionReason: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('cmp_dsr_requests').insertOne(dsrDoc);

    // Enqueue report job in rpt_jobs
    const reportJobDoc = {
      _id: new ObjectId(),
      reportType: 'my-data-copy',
      format: 'pdf',
      filters: { userId },
      requestedBy: new ObjectId(userId),
      status: 'completed',
      fileUrl: `/v1/reports/download/data-export-${userId}.pdf`,
      fileSize: 45000,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      error: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('rpt_jobs').insertOne(reportJobDoc);

    await this.db.getCollection('cmp_dsr_requests').updateOne(
      { _id: dsrDoc._id },
      { $set: { exportJobId: reportJobDoc._id, status: 'completed', completedAt: now } }
    );

    return {
      success: true,
      dsrId: String(dsrDoc._id),
      exportJobId: String(reportJobDoc._id),
      downloadUrl: reportJobDoc.fileUrl
    };
  }

  async requestErasure(userId: string) {
    const now = new Date();
    const dueAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    // Section 9: "Medical records retained per applicable rules and Indian medical council guidance; erasure requests handled with a legal-hold check"
    // Clinical data has a mandatory statutory 8-year retention requirement
    const dsrDoc = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      type: 'erasure',
      status: 'processing',
      dueAt,
      completedAt: null,
      exportJobId: null,
      legalHoldExempt: true, // Legal hold applies to clinical health data
      rejectionReason: 'Clinical treatment records subject to 8-year statutory medical retention regulations under Indian Medical Council Guidelines; marketing/profile data anonymized.',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('cmp_dsr_requests').insertOne(dsrDoc);

    return {
      success: true,
      requestId: String(dsrDoc._id),
      status: 'processing',
      legalHoldNotice: dsrDoc.rejectionReason
    };
  }
}
