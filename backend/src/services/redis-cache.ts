import Redis from "ioredis";
import { queueConfig } from "../config/queue.config.js";
let client: Redis | null = null;
export function getRedisCacheClient(): Redis {
  if (!client) {
    client = new Redis({
      host: queueConfig.redis.host,
      port: queueConfig.redis.port,
      password: queueConfig.redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: queueConfig.redis.maxRetriesPerRequest,
      retryStrategy: queueConfig.redis.retryStrategy,
      enableReadyCheck: queueConfig.redis.enableReadyCheck,
    });
  }
  return client;
}
export async function disconnectRedisCache(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
