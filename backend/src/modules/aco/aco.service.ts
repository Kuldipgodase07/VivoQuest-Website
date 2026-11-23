import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class AcoService {
  constructor(private readonly db: DatabaseService) {}

  async getCohorts() {
    return this.db.getCollection('aco_cohorts').find({ deletedAt: null }).toArray();
  }

  async createCohort(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      name: data.name,
      condition: data.condition,
      criteria: data.criteria || {},
      patientCount: data.patientCount || 0,
      status: 'active',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('aco_cohorts').insertOne(doc);
    return doc;
  }

  async getMeasures() {
    return this.db.getCollection('aco_measures').find({ deletedAt: null }).toArray();
  }

  async createMeasure(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      code: data.code,
      name: data.name,
      category: data.category,
      targetRate: data.targetRate,
      currentRate: data.currentRate || 0,
      period: data.period || '2026-Q4',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('aco_measures').insertOne(doc);
    return doc;
  }

  async getOutcomes(patientId?: string) {
    const filter: any = { deletedAt: null };
    if (patientId && ObjectId.isValid(patientId)) filter.patientId = new ObjectId(patientId);
    return this.db.getCollection('aco_outcomes').find(filter).toArray();
  }

  async recordOutcome(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      patientId: new ObjectId(data.patientId),
      cohortId: new ObjectId(data.cohortId),
      score: data.score,
      readmission30d: !!data.readmission30d,
      evaluatedAt: new Date(data.evaluatedAt || now),
      notes: data.notes || null,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('aco_outcomes').insertOne(doc);
    return doc;
  }

  async getPrograms() {
    return this.db.getCollection('aco_programs').find({ deletedAt: null }).toArray();
  }

  async createProgram(data: any, userId: string) {
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      name: data.name,
      payerOrganizationId: new ObjectId(data.payerOrganizationId),
      startDate: new Date(data.startDate || now),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: 'active',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      deletedAt: null
    };
    await this.db.getCollection('aco_programs').insertOne(doc);
    return doc;
  }
}
