import { Queue } from 'bullmq';
import { queueConfig } from '../../config/queue.config.js';

let auditQueue: Queue | null = null;

function getAuditQueue(): Queue {
  if (!auditQueue) {
    auditQueue = new Queue('audit', {
      connection: { host: queueConfig.redis.host, port: queueConfig.redis.port },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 100,
      },
    });
  }
  return auditQueue;
}

export async function enqueueAuditEvent(event: string, accountId: string | undefined, details?: Record<string, unknown>): Promise<void> {
  try {
    const queue = getAuditQueue();
    queue.add('audit-event', { event, accountId, details: details || {} }).catch(() => {});
  } catch {
    // silently fail — audit should never block the main flow
  }
}
