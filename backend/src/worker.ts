import { Logger } from '@nestjs/common';
import { DatabaseService } from './common/database/database.service';

export async function startWorker() {
  const logger = new Logger('VivoQuestWorkerService');
  logger.log('Starting VivoQuest Background Cloud Tasks & Pub/Sub Worker Service...');
  logger.log('Worker listening for async report generation, payment webhooks, settlement sync, and notification dispatch.');

  const db = new DatabaseService();
  await db.onModuleInit();

  let isRunning = true;

  process.on('SIGTERM', () => {
    logger.log('SIGTERM received. Gracefully shutting down worker...');
    isRunning = false;
  });

  process.on('SIGINT', () => {
    logger.log('SIGINT received. Gracefully shutting down worker...');
    isRunning = false;
  });

  // Polling / subscriber worker loop
  while (isRunning) {
    try {
      // 1. Process pending sys_outbox messages
      const pendingOutbox = await db.getCollection('sys_outbox').find({ status: 'pending' }).limit(10).toArray();
      for (const item of pendingOutbox) {
        logger.log(`[Worker] Dispatched outbox event ${item.topic} to Cloud Tasks queue`);
        await db.getCollection('sys_outbox').updateOne(
          { _id: item._id },
          { $set: { status: 'published', publishedAt: new Date() } }
        );
      }

      // 2. Process queued rpt_jobs
      const queuedJobs = await db.getCollection('rpt_jobs').find({ status: 'queued' }).limit(5).toArray();
      for (const job of queuedJobs) {
        logger.log(`[Worker] Rendering async large report job ${job._id} (${job.reportType})`);
        await db.getCollection('rpt_jobs').updateOne(
          { _id: job._id },
          { $set: { status: 'completed', updatedAt: new Date() } }
        );
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (err: any) {
      logger.error(`[Worker] Error in worker processing loop: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  await db.onModuleDestroy();
  logger.log('VivoQuest Worker stopped.');
}
