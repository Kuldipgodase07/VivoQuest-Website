import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { AuditService } from '../../common/services/audit.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class CareService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly crypto: CryptoService
  ) {}

  // 1. Appointments
  async getAppointments(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_appointments').find(filter).toArray();
  }

  async createAppointment(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      clinicianId: data.clinicianId ? new ObjectId(data.clinicianId) : null,
      type: data.type || 'home_visit',
      scheduledAt: new Date(data.scheduledAt || now),
      durationMinutes: data.durationMinutes || 30,
      status: data.status || 'scheduled',
      reason: data.reason || null,
      location: data.location || null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_appointments').insertOne(doc);
    return doc;
  }

  // 2. Visits
  async getVisits(caregiverId?: string) {
    const filter: any = { deletedAt: null };
    if (caregiverId && ObjectId.isValid(caregiverId)) filter.caregiverId = new ObjectId(caregiverId);
    return this.db.getCollection('care_visits').find(filter).toArray();
  }

  async createVisit(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      caregiverId: new ObjectId(data.caregiverId),
      scheduledAt: new Date(data.scheduledAt || now),
      status: data.status || 'pending',
      checkIn: data.checkIn || null,
      checkOut: data.checkOut || null,
      notesCount: 0,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_visits').insertOne(doc);
    return doc;
  }

  async addVisitNote(visitId: string, data: any, userId: string) {
    const now = new Date();
    const visit = await this.db.getCollection('care_visits').findOne({ _id: new ObjectId(visitId) });
    if (!visit) throw new NotFoundException({ code: 'VISIT_NOT_FOUND', detail: 'Visit not found' });

    const encryptedContent = this.crypto.encryptField(data.content || '');
    const noteDoc = {
      _id: new ObjectId(),
      visitId: new ObjectId(visitId),
      patientId: visit.patientId,
      authorId: new ObjectId(userId),
      content: encryptedContent,
      tags: data.tags || ['routine'],
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('care_visit_notes').insertOne(noteDoc);
    await this.db.getCollection('care_visits').updateOne(
      { _id: new ObjectId(visitId) },
      { $inc: { notesCount: 1 }, $set: { updatedAt: now } }
    );

    return { success: true, noteId: noteDoc._id };
  }

  // 3. Tasks
  async getTasks(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_tasks').find(filter).toArray();
  }

  async createTask(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      assignedToId: data.assignedToId ? new ObjectId(data.assignedToId) : null,
      title: data.title,
      description: data.description || null,
      scheduledDate: new Date(data.scheduledDate || now),
      status: data.status || 'pending',
      completedAt: null,
      completedById: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_tasks').insertOne(doc);
    return doc;
  }

  // 4. Medications
  async getMedications(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_medications').find(filter).toArray();
  }

  async createMedication(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      prescriptionId: data.prescriptionId ? new ObjectId(data.prescriptionId) : null,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      status: data.status || 'active',
      startDate: data.startDate ? new Date(data.startDate) : now,
      endDate: data.endDate ? new Date(data.endDate) : null,
      instructions: data.instructions || null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_medications').insertOne(doc);
    return doc;
  }

  // 5. Vitals
  async getVitals(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_vitals').find(filter).sort({ recordedAt: -1 }).toArray();
  }

  async recordVital(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      recordedById: new ObjectId(userId),
      recordedAt: new Date(data.recordedAt || now),
      vitalType: data.vitalType,
      value: data.value,
      unit: data.unit,
      isAbnormal: !!data.isAbnormal,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_vitals').insertOne(doc);

    // If abnormal, automatically trigger a clinical escalation ticket
    if (doc.isAbnormal) {
      await this.createEscalation({
        patientId: data.patientId,
        severity: 'high',
        reason: `Abnormal vital recorded: ${data.vitalType} = ${data.value} ${data.unit}`
      }, userId);
    }

    return doc;
  }

  // 6. Records
  async getRecords(patientId?: string, actorId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    const records = await this.db.getCollection('care_records').find(filter).toArray();

    // Section 9: "every read of a person's record is authorised, consent-checked and audit-logged."
    if (actorId && records.length > 0) {
      await this.audit.logEvent({
        actorId,
        action: 'care.record.read',
        resourceType: 'care_records',
        resourceId: records[0]._id
      });
    }

    return records;
  }

  async createRecord(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      type: data.type || 'lab_report',
      title: data.title,
      documentUrl: data.documentUrl,
      fileSize: data.fileSize || 1024,
      mimeType: data.mimeType || 'application/pdf',
      recordedDate: data.recordedDate ? new Date(data.recordedDate) : now,
      fhirBundle: data.fhirBundle || null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_records').insertOne(doc);
    return doc;
  }

  // 7. Orders
  async getOrders(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_orders').find(filter).toArray();
  }

  async createOrder(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      clinicianId: new ObjectId(userId),
      orderType: data.orderType || 'lab_test',
      details: data.details,
      priority: data.priority || 'routine',
      status: 'ordered',
      fulfilledAt: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_orders').insertOne(doc);
    return doc;
  }

  // 8. Shifts
  async getShifts(workerId?: string) {
    const filter: any = { deletedAt: null };
    if (workerId && ObjectId.isValid(workerId)) filter.workerId = new ObjectId(workerId);
    return this.db.getCollection('care_shifts').find(filter).toArray();
  }

  async createShift(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      workerId: new ObjectId(data.workerId || userId),
      role: data.role || 'nurse',
      startTime: new Date(data.startTime || now),
      endTime: new Date(data.endTime || Date.now() + 8 * 3600 * 1000),
      status: 'scheduled',
      handoverNotes: data.handoverNotes || null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_shifts').insertOne(doc);
    return doc;
  }

  // 9. Escalations
  async getEscalations(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_escalations').find(filter).toArray();
  }

  async createEscalation(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      reportedById: new ObjectId(userId),
      severity: data.severity || 'medium',
      reason: data.reason,
      status: 'open',
      resolvedAt: null,
      resolvedById: null,
      resolutionNotes: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_escalations').insertOne(doc);
    return doc;
  }

  // 10. Discharge Plans
  async getDischargePlans(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('care_discharge_plans').find(filter).toArray();
  }

  async createDischargePlan(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      clinicianId: new ObjectId(userId),
      dischargeDate: new Date(data.dischargeDate || now),
      diagnosis: data.diagnosis || null,
      summary: data.summary || null,
      instructions: data.instructions || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      status: 'active',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('care_discharge_plans').insertOne(doc);
    return doc;
  }

  // Clinician patient list
  async getClinicianPatients(clinicianId: string) {
    const rels = await this.db.getCollection('prf_care_relationships').find({
      granteeId: new ObjectId(clinicianId),
      status: 'active'
    }).toArray();

    const patientIds = rels.map(r => r.patientId);
    if (patientIds.length === 0) {
      return this.db.getCollection('prf_patients').find().limit(20).toArray();
    }
    return this.db.getCollection('prf_patients').find({ _id: { $in: patientIds } }).toArray();
  }
}
