import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class VaccinationsService {
  constructor(private readonly db: DatabaseService) {}

  async getSchedules() {
    return this.db.getCollection('vac_schedules').find({ deletedAt: null }).toArray();
  }

  async getPatientDoses(patientId: string) {
    const filter = ObjectId.isValid(patientId) ? { patientId: new ObjectId(patientId) } : {};
    return this.db.getCollection('vac_doses').find(filter).sort({ administeredAt: -1 }).toArray();
  }

  async recordDose(scheduleId: string, data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      scheduleId: new ObjectId(scheduleId),
      doseNumber: data.doseNumber || 1,
      batchNumber: data.batchNumber || 'BN-2026-X',
      administeredAt: new Date(data.administeredAt || now),
      administeredById: new ObjectId(userId),
      status: 'completed',
      adverseReaction: data.adverseReaction || null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };

    await this.db.getCollection('vac_doses').insertOne(doc);

    // If completed doses match requirement, generate certificate
    const schedule = await this.db.getCollection('vac_schedules').findOne({ _id: new ObjectId(scheduleId) });
    const count = await this.db.getCollection('vac_doses').countDocuments({
      patientId: doc.patientId,
      scheduleId: doc.scheduleId,
      status: 'completed'
    });

    let certificateNo = null;
    if (schedule && count >= schedule.dosesRequired) {
      certificateNo = `VAC-VQ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await this.db.getCollection('vac_certificates').insertOne({
        _id: new ObjectId(),
        certificateNo,
        patientId: doc.patientId,
        scheduleId: doc.scheduleId,
        issuedAt: now,
        qrCodePayload: `https://verify.vivoquest.in/cert/${certificateNo}`,
        downloadUrl: `/v1/vaccinations/${certificateNo}/download`,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        deletedAt: null
      });
    }

    return { success: true, dose: doc, certificateNo };
  }

  async getCertificate(identifier: string) {
    const filter = ObjectId.isValid(identifier)
      ? { $or: [{ _id: new ObjectId(identifier) }, { certificateNo: identifier }, { patientId: new ObjectId(identifier) }] }
      : { certificateNo: identifier };

    const cert = await this.db.getCollection('vac_certificates').findOne(filter);
    if (!cert) {
      throw new NotFoundException({ code: 'VACCINE_CERT_NOT_FOUND', detail: 'Vaccination certificate not found.' });
    }
    return cert;
  }
}
