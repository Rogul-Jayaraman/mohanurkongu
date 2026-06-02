import { createHash } from 'node:crypto';
import { getRedisClient } from '../../services/redis.js';
import { CacheManager } from './CacheManager.js';
import { logger } from '../utils/logger.js';

const MIGRATIONS_LOCK_KEY = 'migrations.lock';
const CURRENT_CACHE_VERSION = 'v1';
const CACHE_BREAKING_MIGRATIONS: string[] = [];

function computeVersionHash(): string {
  const input = CACHE_BREAKING_MIGRATIONS.join('|') || 'initial';
  return createHash('sha256').update(input).digest('hex').slice(0, 8);
}

export async function initializeCache(): Promise<CacheManager> {
  const redis = getRedisClient();
  const version = `v${computeVersionHash()}`;
  const cacheManager = CacheManager.init(redis, version);

  try {
    const stored = await cacheManager.getVersion();
    if (stored && stored !== version) {
      logger.info({ oldVersion: stored, newVersion: version }, 'cache version bump detected; flushing old data');
      const deleted = await cacheManager.flushOldVersion(stored);
      logger.info({ deleted, oldVersion: stored }, 'old cache flushed');
    }
    await cacheManager.setVersion(version);
  } catch (err) {
    logger.warn({ err }, 'cache version check failed; continuing with current version');
  }

  return cacheManager;
}

export async function recordMigration(migrationName: string): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.hset(MIGRATIONS_LOCK_KEY, migrationName, 'applied');
  } catch (err) {
    logger.warn({ err, migrationName }, 'failed to record migration');
  }
}

export async function isMigrationApplied(migrationName: string): Promise<boolean> {
  const redis = getRedisClient();
  try {
    const result = await redis.hget(MIGRATIONS_LOCK_KEY, migrationName);
    return result === 'applied';
  } catch {
    return false;
  }
}

export { CURRENT_CACHE_VERSION };
