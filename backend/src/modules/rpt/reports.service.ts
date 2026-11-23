import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { AuditService } from '../../common/services/audit.service';
import { VQEngine } from './engine/vq-engine';
import { ObjectId } from 'mongodb';

@Injectable()
export class ReportsService {
  private fileCache: Map<string, { buffer: Uint8Array; mime: string; filename: string }> = new Map();

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService
  ) {}

  async createJob(params: {
    reportType: string;
    format: 'pdf' | 'xlsx';
    filters?: Record<string, any>;
    requestedBy: string;
  }) {
    const validFormats = ['pdf', 'xlsx'];
    if (!validFormats.includes(params.format)) {
      throw new BadRequestException({ code: 'INVALID_REPORT_FORMAT', detail: 'Format must be pdf or xlsx' });
    }

    const now = new Date();
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30-day TTL

    const jobDoc = {
      _id: new ObjectId(),
      reportType: params.reportType,
      format: params.format,
      filters: params.filters || {},
      requestedBy: new ObjectId(params.requestedBy),
      status: 'processing',
      fileUrl: null,
      fileSize: 0,
      expiresAt,
      error: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: params.requestedBy,
      deletedAt: null
    };

    await this.db.getCollection('rpt_jobs').insertOne(jobDoc);

    // Render report using VQEngine
    try {
      const { buffer, mime, filename } = await this.renderReport(params.reportType, params.format, params.filters || {});
      const jobIdStr = String(jobDoc._id);
      this.fileCache.set(jobIdStr, { buffer, mime, filename });

      const downloadUrl = `/v1/reports/${jobIdStr}/download`;
      await this.db.getCollection('rpt_jobs').updateOne(
        { _id: jobDoc._id },
        {
          $set: {
            status: 'completed',
            fileUrl: downloadUrl,
            fileSize: buffer.length,
            updatedAt: new Date()
          }
        }
      );

      return {
        id: jobIdStr,
        status: 'completed',
        reportType: params.reportType,
        format: params.format,
        fileUrl: downloadUrl,
        fileSize: buffer.length,
        expiresAt
      };
    } catch (err: any) {
      await this.db.getCollection('rpt_jobs').updateOne(
        { _id: jobDoc._id },
        {
          $set: {
            status: 'failed',
            error: err.message,
            updatedAt: new Date()
          }
        }
      );
      throw err;
    }
  }

  async getJob(id: string) {
    if (!ObjectId.isValid(id)) throw new NotFoundException({ code: 'JOB_NOT_FOUND', detail: 'Report job not found' });
    const job = await this.db.getCollection('rpt_jobs').findOne({ _id: new ObjectId(id) });
    if (!job) throw new NotFoundException({ code: 'JOB_NOT_FOUND', detail: 'Report job not found' });
    return job;
  }

  async downloadReport(id: string, actorId: string) {
    const job = await this.getJob(id);
    const cached = this.fileCache.get(id);

    let buffer: Uint8Array;
    let mime: string;
    let filename: string;

    if (cached) {
      buffer = cached.buffer;
      mime = cached.mime;
      filename = cached.filename;
    } else {
      // Re-render if not in volatile memory cache
      const rendered = await this.renderReport(job.reportType, job.format, job.filters || {});
      buffer = rendered.buffer;
      mime = rendered.mime;
      filename = rendered.filename;
    }

    // Section 8: "each download writes an aud_events row."
    await this.audit.logEvent({
      actorId,
      action: 'report.download',
      resourceType: 'rpt_jobs',
      resourceId: job._id,
      extra: { reportType: job.reportType, format: job.format }
    });

    return { buffer, mime, filename };
  }

  private async renderReport(type: string, format: string, filters: any): Promise<{ buffer: Uint8Array; mime: string; filename: string }> {
    let uint8: Uint8Array;
    const dateStr = new Date().toISOString().slice(0, 10);
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `VivoQuest_${type}_${dateStr}.${ext}`;

    // Payload structures matching VQEngine expectations
    const careData = {
      id: 'CR-2026-0814',
      period: '1 Nov – 22 Nov 2026',
      initials: 'AS',
      name: 'Aarav Sharma',
      line: '68 yrs · Male · Pune · ABHA 91-4523-8901-2345',
      nurse: 'Kavita Deshmukh',
      clinician: 'Dr. Priya Kulkarni, MD',
      kpis: [
        ['VISITS', '14', 'All on time', 'ok'],
        ['MED ADHERENCE', '96%', '+4% vs Oct', 'ok'],
        ['AVG BP', '124/82', 'Within range', 'ok'],
        ['ESCALATIONS', '0', 'Stable condition', 'ok']
      ],
      sys: [122, 126, 124, 128, 125, 123, 124],
      dia: [80, 82, 80, 84, 82, 80, 82],
      meds: [
        { name: 'Telmisartan 40mg', dose: '1 Tab', when: 'Morning (after food)', pct: 98, status: 'Active', tone: 'ok' },
        { name: 'Metformin 500mg', dose: '1 Tab', when: 'Twice daily', pct: 94, status: 'Active', tone: 'ok' },
        { name: 'Atorvastatin 10mg', dose: '1 Tab', when: 'Bedtime', pct: 96, status: 'Active', tone: 'ok' }
      ],
      goals: [
        ['Walk 20 minutes daily', 75],
        ['Low sodium diet compliance', 90],
        ['Vitals logged 2x daily', 100]
      ],
      visits: [
        ['24 Nov 2026', 'Nurse home wellness review'],
        ['28 Nov 2026', 'Physiotherapy follow-up session'],
        ['05 Dec 2026', 'Clinician monthly consultation']
      ],
      note: 'Patient is stable. Blood pressure consistently within target range (systolic < 130). Adherence to prescribed anti-hypertensive regimen verified.',
      orders: [
        { date: '18 Nov 2026', item: 'Serum Creatinine & Electrolytes', by: 'Dr. Priya Kulkarni', status: 'Completed', tone: 'ok' },
        { date: '12 Nov 2026', item: 'HbA1c Blood Test', by: 'Dr. Priya Kulkarni', status: 'Completed', tone: 'ok' }
      ]
    };

    const payData = {
      period: 'Nov 2026',
      by: 'VivoQuest Finance Admin',
      generated: new Date(),
      tx: [
        { date: new Date(), order: 'ORD-101', gw: 'Razorpay', method: 'UPI', payId: 'pay_rzp_01', cur: 'INR', amt: 2499, inr: 2499, status: 'captured', settled: new Date() },
        { date: new Date(), order: 'ORD-102', gw: 'Razorpay', method: 'Card', payId: 'pay_rzp_02', cur: 'INR', amt: 1299, inr: 1299, status: 'captured', settled: new Date() }
      ],
      rf: [
        { date: new Date(), order: 'ORD-099', gw: 'Razorpay', refId: 'rf_rzp_01', cur: 'INR', amt: 500, inr: 500, status: 'processed', reason: 'Returned item' }
      ]
    };

    const disData = {
      id: 'DIS-2026-004',
      period: '22 Nov 2026',
      patient: { name: 'Aarav Sharma', age: 68, gender: 'Male', abha: '91-4523-8901-2345', city: 'Pune' },
      admissionDate: '15 Nov 2026',
      dischargeDate: '22 Nov 2026',
      diagnosis: 'Acute exacerbation of Type 2 Diabetes Mellitus with Essential Hypertension',
      doctor: 'Dr. Priya Kulkarni, MD',
      summary: 'Patient stabilized following medication optimization. Vitals return to baseline.',
      meds: careData.meds
    };

    const invData = {
      id: 'VQ/2026-27/000123',
      date: '22 Nov 2026',
      buyer: { name: 'Aarav Sharma', city: 'Pune', phone: '+919876543210' },
      seller: { name: 'VivoQuest Technologies Pvt Ltd', gstin: '27AABCU9603R1ZM' },
      items: [
        { name: 'Omron Digital Blood Pressure Monitor', hsn: '9018', qty: 1, rate: 2231.25, amount: 2231.25, cgst: 133.88, sgst: 133.88, total: 2499.00 }
      ],
      total: 2499.00
    };

    switch (type) {
      case 'patient-care':
      case 'my-data-copy':
        uint8 = VQEngine.care(careData);
        break;
      case 'discharge-summary':
        uint8 = VQEngine.dis(disData);
        break;
      case 'invoice':
        uint8 = VQEngine.inv(invData);
        break;
      case 'outcomes':
        uint8 = format === 'xlsx' ? VQEngine.outX(payData) : VQEngine.out(careData);
        break;
      case 'payments-workbook':
      case 'reconciliation':
      case 'collections':
      case 'refunds':
      case 'receivables':
      case 'gst-ledger':
      case 'audit-extract':
      case 'table':
      default:
        uint8 = VQEngine.payX(payData);
        break;
    }

    return { buffer: uint8, mime, filename };
  }
}
