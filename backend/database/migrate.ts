import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { COLLECTIONS } from './schemas/definitions';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vivoquest_dev';

export async function runMigrations() {
  console.log(`[Migration] Connecting to MongoDB: ${MONGODB_URI.replace(/:([^:@]{3})[^:@]*@/, ':***@')}`);
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  
  try {
    await client.connect();
    const db = client.db();
    console.log(`[Migration] Connected to database: ${db.databaseName}`);
    
    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));
    
    const collectionEntries = Object.entries(COLLECTIONS);
    console.log(`[Migration] Processing ${collectionEntries.length} collections defined in Section 4...`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let indexCount = 0;
    
    for (const [collName, spec] of collectionEntries) {
      if (!existingNames.has(collName)) {
        await db.createCollection(collName, {
          validator: spec.validator,
          validationLevel: 'strict',
          validationAction: 'error'
        });
        createdCount++;
      } else {
        try {
          await db.command({
            collMod: collName,
            validator: spec.validator,
            validationLevel: 'strict',
            validationAction: 'error'
          });
          updatedCount++;
        } catch (e: any) {
          console.warn(`[Migration] Notice on updating validator for ${collName}: ${e.message}`);
        }
      }
      
      // Apply indexes
      const coll = db.collection(collName);
      for (const idx of spec.indexes) {
        try {
          const indexOptions: any = {
            name: idx.name,
            background: true
          };
          if (idx.unique) indexOptions.unique = true;
          if (idx.expireAfterSeconds !== undefined) indexOptions.expireAfterSeconds = idx.expireAfterSeconds;
          if (idx.partialFilterExpression) indexOptions.partialFilterExpression = idx.partialFilterExpression;
          
          await coll.createIndex(idx.key as any, indexOptions);
          indexCount++;
        } catch (idxErr: any) {
          // If index already exists with different options or during re-run
          console.warn(`[Migration] Index ${idx.name} on ${collName}: ${idxErr.message}`);
        }
      }
    }
    
    console.log(`[Migration] Migration complete!`);
    console.log(`[Migration] - Collections created: ${createdCount}`);
    console.log(`[Migration] - Collections verified/updated: ${updatedCount}`);
    console.log(`[Migration] - Total collections: ${collectionEntries.length}`);
    console.log(`[Migration] - Indexes verified/created: ${indexCount}`);
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  runMigrations().then(() => {
    console.log('[Migration] Done.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Migration] Error:', err);
    process.exit(1);
  });
}
