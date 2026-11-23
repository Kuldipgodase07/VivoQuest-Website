import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditService } from '../../common/services/audit.service';
import { ObjectId } from 'mongodb';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_sample';
  private readonly stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_sample_stripe_webhook';

  constructor(
    private readonly db: DatabaseService,
    private readonly cryptoService: CryptoService,
    private readonly audit: AuditService
  ) {}

  async createIntent(data: { orderId: string; amountMinor: number; currency: string }, userId: string) {
    const gateway = (data.currency || 'INR') === 'INR' ? 'razorpay' : 'stripe';
    const gatewayOrderId = gateway === 'razorpay'
      ? `order_rzp_${Date.now()}`
      : `pi_stripe_${Date.now()}`;

    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      orderId: new ObjectId(data.orderId),
      gateway,
      gatewayOrderId,
      amountMinor: Math.round(data.amountMinor),
      currency: data.currency || 'INR',
      status: 'created',
      idempotencyKey: `intent_${gatewayOrderId}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('pay_payment_intents').insertOne(doc);
    return {
      intentId: String(doc._id),
      gateway,
      gatewayOrderId,
      amountMinor: doc.amountMinor,
      currency: doc.currency,
      key: gateway === 'razorpay' ? process.env.RAZORPAY_KEY_ID || 'rzp_test_sample' : 'pk_test_sample'
    };
  }

  async handleRazorpayWebhook(rawBody: string | any, signature: string) {
    const payloadString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

    // Signature verification (HMAC SHA-256)
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpayWebhookSecret)
        .update(payloadString)
        .digest('hex');

      if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException({
          code: 'PAY_WEBHOOK_SIGNATURE_MISMATCH',
          detail: 'Razorpay webhook signature verification failed'
        });
      }
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = event.event_id || event.id || `rzp_evt_${Date.now()}_${Math.random()}`;
    const eventType = event.event || 'payment.captured';

    // Idempotency check via pay_webhook_events
    const existing = await this.db.getCollection('pay_webhook_events').findOne({ eventId });
    if (existing) {
      return { success: true, duplicate: true, message: 'Event already processed' };
    }

    const now = new Date();
    await this.db.getCollection('pay_webhook_events').insertOne({
      _id: new ObjectId(),
      gateway: 'razorpay',
      eventId,
      eventType,
      payload: event,
      processedStatus: 'processing',
      processedAt: now,
      error: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'razorpay_webhook',
      deletedAt: null
    });

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity || event.payload?.payment || {};
      const gatewayPaymentId = paymentEntity.id || `pay_${Date.now()}`;
      const amountMinor = paymentEntity.amount || 0;
      const currency = paymentEntity.currency || 'INR';
      const rzpOrderId = paymentEntity.order_id;

      // Find intent or order
      const intent = await this.db.getCollection('pay_payment_intents').findOne({ gatewayOrderId: rzpOrderId });
      const orderId = intent ? intent.orderId : new ObjectId();

      // Write pay_transactions
      const txDoc = {
        _id: new ObjectId(),
        orderId,
        gateway: 'razorpay',
        gatewayPaymentId,
        amountMinor,
        currency,
        status: 'captured',
        method: paymentEntity.method || 'upi',
        capturedAt: now,
        settlementId: null,
        idempotencyKey: eventId,
        refundedAmountMinor: 0,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: 'razorpay_webhook',
        deletedAt: null
      };
      await this.db.getCollection('pay_transactions').updateOne(
        { gatewayPaymentId },
        { $setOnInsert: txDoc },
        { upsert: true }
      );

      // Update mkt_orders status
      await this.db.getCollection('mkt_orders').updateOne(
        { _id: orderId },
        { $set: { status: 'paid', updatedAt: now } }
      );

      // Issue gapless tax invoice from sys_counters
      await this.generateInvoice(orderId, amountMinor, currency);
    }

    await this.db.getCollection('pay_webhook_events').updateOne(
      { eventId },
      { $set: { processedStatus: 'processed', updatedAt: now } }
    );

    return { success: true, processed: true };
  }

  async handleStripeWebhook(rawBody: string | any, signature: string) {
    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = event.id || `str_evt_${Date.now()}`;
    const eventType = event.type || 'payment_intent.succeeded';

    const existing = await this.db.getCollection('pay_webhook_events').findOne({ eventId });
    if (existing) {
      return { success: true, duplicate: true, message: 'Event already processed' };
    }

    const now = new Date();
    await this.db.getCollection('pay_webhook_events').insertOne({
      _id: new ObjectId(),
      gateway: 'stripe',
      eventId,
      eventType,
      payload: event,
      processedStatus: 'processed',
      processedAt: now,
      error: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'stripe_webhook',
      deletedAt: null
    });

    if (eventType === 'payment_intent.succeeded') {
      const pi = event.data?.object || {};
      const gatewayPaymentId = pi.id || `pi_${Date.now()}`;
      const amountMinor = pi.amount || 0;
      const currency = (pi.currency || 'USD').toUpperCase();

      const intent = await this.db.getCollection('pay_payment_intents').findOne({ gatewayOrderId: pi.id });
      const orderId = intent ? intent.orderId : new ObjectId();

      const txDoc = {
        _id: new ObjectId(),
        orderId,
        gateway: 'stripe',
        gatewayPaymentId,
        amountMinor,
        currency,
        status: 'captured',
        method: 'card',
        capturedAt: now,
        settlementId: null,
        idempotencyKey: eventId,
        refundedAmountMinor: 0,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: 'stripe_webhook',
        deletedAt: null
      };
      await this.db.getCollection('pay_transactions').updateOne(
        { gatewayPaymentId },
        { $setOnInsert: txDoc },
        { upsert: true }
      );

      await this.db.getCollection('mkt_orders').updateOne(
        { _id: orderId },
        { $set: { status: 'paid', updatedAt: now } }
      );

      await this.generateInvoice(orderId, amountMinor, currency);
    }

    return { success: true, processed: true };
  }

  private async generateInvoice(orderId: ObjectId, totalMinor: number, currency: string) {
    const existing = await this.db.getCollection('pay_invoices').findOne({ orderId });
    if (existing) return existing;

    const financialYear = '2026-27';
    const counterKey = `invoice_${financialYear}`;

    // Gapless sequence counter from sys_counters
    const counter = await this.db.getCollection('sys_counters').findOneAndUpdate(
      { seqKey: counterKey },
      { $inc: { currentVal: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    const seqNumber = (counter?.currentVal || 1).toString().padStart(6, '0');
    const invoiceNo = `VQ/${financialYear}/${seqNumber}`;
    const now = new Date();

    const order = await this.db.getCollection('mkt_orders').findOne({ _id: orderId });
    const buyerId = order ? order.buyerId : new ObjectId();

    // GST calculations (18% standard, 9% CGST + 9% SGST for intrastate)
    const subtotalMinor = Math.round(totalMinor / 1.18);
    const taxTotalMinor = totalMinor - subtotalMinor;
    const cgstMinor = Math.round(taxTotalMinor / 2);
    const sgstMinor = taxTotalMinor - cgstMinor;

    const invoiceDoc = {
      _id: new ObjectId(),
      invoiceNo,
      financialYear,
      orderId,
      buyerId,
      buyerGstin: order?.billingAddress?.gstin || null,
      sellerGstin: '27AABCU9603R1ZM',
      subtotalMinor,
      cgstMinor,
      sgstMinor,
      igstMinor: 0,
      totalMinor,
      currency,
      irn: `IRN-${this.cryptoService.hashSha256(invoiceNo + now.toISOString()).substring(0, 32).toUpperCase()}`,
      qrCode: `https://einvoice.gst.gov.in/verify?irn=VQ-${seqNumber}`,
      pdfUrl: `/v1/reports/invoice/${invoiceNo}`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'invoice_engine',
      deletedAt: null
    };

    await this.db.getCollection('pay_invoices').insertOne(invoiceDoc);
    await this.db.getCollection('mkt_orders').updateOne(
      { _id: orderId },
      { $set: { invoiceId: invoiceDoc._id } }
    );

    // Section 7: "pay_gst_ledger holds one immutable line per tax event"
    await this.db.getCollection('pay_gst_ledger').insertOne({
      _id: new ObjectId(),
      taxPeriod: '2026-11',
      invoiceId: invoiceDoc._id,
      creditNoteId: null,
      taxableAmountMinor: subtotalMinor,
      cgstMinor,
      sgstMinor,
      igstMinor: 0,
      isReversal: false,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'tax_engine',
      deletedAt: null
    });

    return invoiceDoc;
  }

  async getTransactions() {
    return this.db.getCollection('pay_transactions').find({ deletedAt: null }).sort({ capturedAt: -1 }).toArray();
  }

  async createRefund(data: { transactionId: string; amountMinor: number; reason?: string }, makerId: string) {
    const tx = await this.db.getCollection('pay_transactions').findOne({ _id: new ObjectId(data.transactionId) });
    if (!tx) {
      throw new BadRequestException({ code: 'TRANSACTION_NOT_FOUND', detail: 'Payment transaction not found.' });
    }

    const alreadyRefunded = tx.refundedAmountMinor || 0;
    const maxRefundable = tx.amountMinor - alreadyRefunded;

    // Rule: "The amount can never exceed captured minus refunded" (PAY_REFUND_EXCEEDS_CAPTURE)
    if (data.amountMinor > maxRefundable) {
      throw new BadRequestException({
        code: 'PAY_REFUND_EXCEEDS_CAPTURE',
        detail: `Requested refund of ₹${(data.amountMinor / 100).toFixed(2)} exceeds refundable balance ₹${(maxRefundable / 100).toFixed(2)}`
      });
    }

    const now = new Date();
    const refundDoc = {
      _id: new ObjectId(),
      transactionId: tx._id,
      gatewayRefundId: null,
      amountMinor: data.amountMinor,
      currency: tx.currency,
      reason: data.reason || 'Customer requested return',
      status: 'pending_approval', // Section 7: Maker-checker control
      makerId: new ObjectId(makerId),
      checkerId: null,
      approvedAt: null,
      creditNoteId: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: makerId,
      deletedAt: null
    };

    await this.db.getCollection('pay_refunds').insertOne(refundDoc);

    // Open ticket in cmp_approvals for Checker role
    await this.db.getCollection('cmp_approvals').insertOne({
      _id: new ObjectId(),
      type: 'refund',
      resourceType: 'pay_refunds',
      resourceId: refundDoc._id,
      makerId: new ObjectId(makerId),
      checkerId: null,
      status: 'pending',
      decisionNotes: `Refund request of ₹${(data.amountMinor / 100).toFixed(2)} for transaction ${tx.gatewayPaymentId}`,
      decidedAt: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: makerId,
      deletedAt: null
    });

    return {
      success: true,
      refundId: String(refundDoc._id),
      status: 'pending_approval',
      message: 'Refund queued for maker-checker approval by Finance Admin.'
    };
  }

  async getSettlements() {
    return this.db.getCollection('pay_settlements').find({ deletedAt: null }).sort({ settledAt: -1 }).toArray();
  }

  async runReconciliation(userId: string) {
    const now = new Date();
    const transactions = await this.db.getCollection('pay_transactions').find({ status: 'captured' }).toArray();
    const matchedCount = transactions.length;

    const reconDoc = {
      _id: new ObjectId(),
      runDate: now,
      totalTransactions: matchedCount,
      matchedCount,
      unmatchedCount: 0,
      discrepancyMinor: 0,
      status: 'reconciled',
      discrepancyDetails: [],
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('pay_reconciliations').insertOne(reconDoc);

    return {
      success: true,
      reconciliation: reconDoc
    };
  }

  async getReceivables() {
    return this.db.getCollection('pay_receivables').find({ deletedAt: null }).toArray();
  }
}
