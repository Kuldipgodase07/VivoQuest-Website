import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CryptoService } from '../crypto/crypto.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private lastHash: string | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoService
  ) {}

  async logEvent(params: {
    actorId: string | ObjectId;
    action: string;
    resourceType: string;
    resourceId: string | ObjectId;
    ip?: string;
    userAgent?: string;
    extra?: Record<string, any>;
  }): Promise<string> {
    const coll = this.db.getCollection('aud_events');
    const now = new Date();

    if (!this.lastHash) {
      // Find latest event to get prevHash
      const latest = await coll.findOne({}, { sort: { at: -1 } });
      this.lastHash = latest?.hash || 'ROOT_GENESIS_EVENT';
    }

    const actorObjectId = typeof params.actorId === 'string' && ObjectId.isValid(params.actorId)
      ? new ObjectId(params.actorId)
      : (params.actorId as ObjectId) || new ObjectId();

    const resourceObjectId = typeof params.resourceId === 'string' && ObjectId.isValid(params.resourceId)
      ? new ObjectId(params.resourceId)
      : (params.resourceId as ObjectId) || new ObjectId();

    const eventPayload = {
      actorId: actorObjectId,
      action: params.action,
      resource: {
        type: params.resourceType,
        id: resourceObjectId
      },
      ip: params.ip || '127.0.0.1',
      userAgent: params.userAgent || 'VivoQuest-API',
      at: now,
      extra: params.extra
    };

    const currentHash = this.crypto.computeAuditHash(this.lastHash, eventPayload);

    await coll.insertOne({
      _id: new ObjectId(),
      ...eventPayload,
      prevHash: this.lastHash,
      hash: currentHash,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: String(actorObjectId),
      deletedAt: null
    });

    this.lastHash = currentHash;
    return currentHash;
  }
}
