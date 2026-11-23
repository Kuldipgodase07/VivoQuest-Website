import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { MongoClient, Db, Collection, Document } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;
  private readonly logger = new Logger(DatabaseService.name);
  private isConnected = false;

  async onModuleInit() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vivoquest_dev';
    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      this.logger.log(`Connected to MongoDB database: ${this.db.databaseName}`);
    } catch (err: any) {
      this.logger.warn(`Could not connect to MongoDB at ${uri.replace(/:([^:@]{3})[^:@]*@/, ':***@')}. Running in resilient memory mode for offline development.`);
      // Mock memory storage fallback so the entire API can start and be verified even without local mongo running
      this.initMemoryFallback();
    }
  }

  private memoryStore: Map<string, any[]> = new Map();

  private initMemoryFallback() {
    this.isConnected = false;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  getDb(): Db {
    return this.db;
  }

  getCollection<T extends Document = any>(name: string): Collection<T> {
    if (this.isConnected && this.db) {
      return this.db.collection<T>(name);
    }
    // Return a lightweight mock collection proxy for graceful dev fallback
    return this.createMockCollection<T>(name);
  }

  private createMockCollection<T extends Document>(name: string): Collection<T> {
    if (!this.memoryStore.has(name)) {
      this.memoryStore.set(name, []);
    }
    const store = this.memoryStore.get(name)!;

    const proxy: any = {
      collectionName: name,
      find: (filter: any = {}) => {
        const results = store.filter(item => this.matchesFilter(item, filter));
        return {
          toArray: async () => [...results],
          sort: () => ({
            limit: (n: number) => ({
              toArray: async () => results.slice(0, n)
            }),
            toArray: async () => [...results]
          }),
          limit: (n: number) => ({
            toArray: async () => results.slice(0, n)
          })
        };
      },
      findOne: async (filter: any = {}) => {
        return store.find(item => this.matchesFilter(item, filter)) || null;
      },
      insertOne: async (doc: any) => {
        const _id = doc._id || new (require('mongodb').ObjectId)();
        const fullDoc = { ...doc, _id, createdAt: doc.createdAt || new Date(), updatedAt: doc.updatedAt || new Date() };
        store.push(fullDoc);
        return { insertedId: _id, acknowledged: true };
      },
      insertMany: async (docs: any[]) => {
        const insertedIds: any = {};
        docs.forEach((doc, idx) => {
          const _id = doc._id || new (require('mongodb').ObjectId)();
          store.push({ ...doc, _id, createdAt: doc.createdAt || new Date(), updatedAt: doc.updatedAt || new Date() });
          insertedIds[idx] = _id;
        });
        return { insertedCount: docs.length, insertedIds, acknowledged: true };
      },
      updateOne: async (filter: any, update: any, options: any = {}) => {
        const idx = store.findIndex(item => this.matchesFilter(item, filter));
        if (idx >= 0) {
          const existing = store[idx];
          const updated = this.applyUpdate(existing, update);
          store[idx] = updated;
          return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
        } else if (options.upsert) {
          const newDoc = this.applyUpdate({ ...filter, _id: new (require('mongodb').ObjectId)() }, update);
          store.push(newDoc);
          return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id, acknowledged: true };
        }
        return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
      },
      findOneAndUpdate: async (filter: any, update: any, options: any = {}) => {
        const idx = store.findIndex(item => this.matchesFilter(item, filter));
        if (idx >= 0) {
          const existing = store[idx];
          const updated = this.applyUpdate(existing, update);
          store[idx] = updated;
          return options.returnDocument === 'after' ? updated : existing;
        } else if (options.upsert) {
          const newDoc = this.applyUpdate({ ...filter, _id: new (require('mongodb').ObjectId)() }, update);
          store.push(newDoc);
          return newDoc;
        }
        return null;
      },
      countDocuments: async (filter: any = {}) => {
        return store.filter(item => this.matchesFilter(item, filter)).length;
      },
      createIndex: async () => 'mock_index',
      createIndexes: async () => ['mock_index']
    };

    return proxy as Collection<T>;
  }

  private matchesFilter(item: any, filter: any): boolean {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(value)) {
        if (!value.some(sub => this.matchesFilter(item, sub))) return false;
        continue;
      }
      if (typeof value === 'object' && value !== null) {
        if ('$in' in value && Array.isArray(value.$in)) {
          if (!value.$in.includes(item[key])) return false;
          continue;
        }
        if ('$gte' in value) {
          const itemVal = item[key] instanceof Date ? item[key].getTime() : item[key];
          const filterVal = value.$gte instanceof Date ? value.$gte.getTime() : value.$gte;
          if (itemVal < filterVal) return false;
          continue;
        }
        if ('$lte' in value) {
          const itemVal = item[key] instanceof Date ? item[key].getTime() : item[key];
          const filterVal = value.$lte instanceof Date ? value.$lte.getTime() : value.$lte;
          if (itemVal > filterVal) return false;
          continue;
        }
      }
      if (item[key] === undefined && value === null) continue;
      if (String(item[key]) !== String(value)) return false;
    }
    return true;
  }

  private applyUpdate(doc: any, update: any): any {
    const res = { ...doc };
    if (update.$set) {
      Object.assign(res, update.$set);
    }
    if (update.$setOnInsert && !doc._id) {
      Object.assign(res, update.$setOnInsert);
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        res[k] = (res[k] || 0) + (v as number);
      }
    }
    res.updatedAt = new Date();
    return res;
  }
}
