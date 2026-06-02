import type { CacheManager } from '../../common/cache/CacheManager.js';
import { buildAnalyticsDashboardTag, CacheTtls } from '../../common/cache/cacheKeys.js';

const CACHE_TIMEOUT_MS = 3_000;

function cacheTimeout<T>(p: Promise<T | null>, label: string): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error(`Cache timed out: ${label}`)), CACHE_TIMEOUT_MS)
    ),
  ]);
}

export class AnalyticsCache {
  constructor(private readonly cacheManager: CacheManager) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      return await cacheTimeout(this.cacheManager.get<T>(`analytics:${key}`), `analytics:${key}`);
    } catch {
      return null;
    }
  }

  async set(key: string, data: unknown, ttlSeconds: number = CacheTtls.ANALYTICS_DASHBOARD): Promise<void> {
    try {
      await this.cacheManager.setByTags([`analytics:${key}`], data, { defaultTtl: ttlSeconds });
    } catch {
      // non-critical
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.cacheManager.flushTags([`analytics:${key}`]);
  }

  async invalidateAll(): Promise<void> {
    await this.cacheManager.flushTags([buildAnalyticsDashboardTag()]);
  }
}
