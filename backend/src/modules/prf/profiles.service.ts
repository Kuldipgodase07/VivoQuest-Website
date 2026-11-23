import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class ProfilesService {
  constructor(private readonly db: DatabaseService) {}

  async getPatient(id: string) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const patient = await this.db.getCollection('prf_patients').findOne(filter);
    if (!patient) throw new NotFoundException({ code: 'PATIENT_NOT_FOUND', detail: 'Patient profile not found' });
    return patient;
  }

  async updatePatient(id: string, data: any) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const now = new Date();
    const updateRes = await this.db.getCollection('prf_patients').findOneAndUpdate(
      filter,
      {
        $set: { ...data, updatedAt: now, schemaVersion: 1 },
        $setOnInsert: { createdAt: now, deletedAt: null }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return updateRes;
  }

  async getCaregiver(id: string) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const caregiver = await this.db.getCollection('prf_caregivers').findOne(filter);
    if (!caregiver) throw new NotFoundException({ code: 'CAREGIVER_NOT_FOUND', detail: 'Caregiver profile not found' });
    return caregiver;
  }

  async updateCaregiver(id: string, data: any) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const now = new Date();
    return this.db.getCollection('prf_caregivers').findOneAndUpdate(
      filter,
      {
        $set: { ...data, updatedAt: now, schemaVersion: 1 },
        $setOnInsert: { createdAt: now, deletedAt: null }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async getNurse(id: string) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const nurse = await this.db.getCollection('prf_nurses').findOne(filter);
    if (!nurse) throw new NotFoundException({ code: 'NURSE_NOT_FOUND', detail: 'Nurse profile not found' });
    return nurse;
  }

  async updateNurse(id: string, data: any) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const now = new Date();
    return this.db.getCollection('prf_nurses').findOneAndUpdate(
      filter,
      {
        $set: { ...data, updatedAt: now, schemaVersion: 1 },
        $setOnInsert: { createdAt: now, deletedAt: null }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async getClinician(id: string) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const clinician = await this.db.getCollection('prf_clinicians').findOne(filter);
    if (!clinician) throw new NotFoundException({ code: 'CLINICIAN_NOT_FOUND', detail: 'Clinician profile not found' });
    return clinician;
  }

  async updateClinician(id: string, data: any) {
    const filter = ObjectId.isValid(id) ? { $or: [{ _id: new ObjectId(id) }, { userId: new ObjectId(id) }] } : { userId: id };
    const now = new Date();
    return this.db.getCollection('prf_clinicians').findOneAndUpdate(
      filter,
      {
        $set: { ...data, updatedAt: now, schemaVersion: 1 },
        $setOnInsert: { createdAt: now, deletedAt: null }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async createCareRelationship(data: {
    patientId: string;
    granteeId: string;
    role: 'caregiver' | 'family' | 'nurse' | 'clinician';
    relationshipType?: string;
  }) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      granteeId: new ObjectId(data.granteeId),
      role: data.role,
      relationshipType: data.relationshipType || data.role,
      status: 'active',
      expiresAt: null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      deletedAt: null
    };

    await this.db.getCollection('prf_care_relationships').updateOne(
      { patientId: doc.patientId, granteeId: doc.granteeId, role: doc.role },
      { $set: doc },
      { upsert: true }
    );

    return { success: true, relationship: doc };
  }
}
