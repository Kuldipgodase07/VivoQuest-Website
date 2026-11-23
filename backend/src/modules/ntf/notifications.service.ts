import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async getPreferences(userId: string) {
    const pref = await this.db.getCollection('ntf_preferences').findOne({ userId: new ObjectId(userId) });
    if (!pref) {
      return {
        userId,
        sms: true,
        email: true,
        whatsapp: true,
        push: true
      };
    }
    return pref;
  }

  async updatePreferences(userId: string, data: { sms?: boolean; email?: boolean; whatsapp?: boolean; push?: boolean }) {
    const now = new Date();
    const updateRes = await this.db.getCollection('ntf_preferences').findOneAndUpdate(
      { userId: new ObjectId(userId) },
      {
        $set: {
          ...data,
          updatedAt: now,
          schemaVersion: 1
        },
        $setOnInsert: {
          userId: new ObjectId(userId),
          createdAt: now,
          createdBy: userId,
          deletedAt: null
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return updateRes;
  }
}
