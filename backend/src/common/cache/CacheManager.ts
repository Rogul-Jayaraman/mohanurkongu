import { createHash } from 'node:crypto';
import type Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { cacheMetrics } from './cacheMetrics.js';

const TAG_PREFIX = 'tag:';
const KEY_PREFIX = 'cache:';
const TAG_SET_TTL_BUFFER_SEC = 60;

export interface SetByTagsOptions {
  defaultTtl: number;
  perTagTtl?: Record<string, number>;
}

export class CacheManager {
  private readonly redis: Redis;
  private readonly version: string;
  private static instance: CacheManager | null = null;

  private constructor(redis: Redis, version: string) {
    this.redis = redis;
    this.version = version;
  }

  static init(redis: Redis, version: string): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(redis, version);
    }
    return CacheManager.instance;
  }

  static getInstance(): CacheManager | null {
    return CacheManager.instance;
  }

  static reset(): void {
    CacheManager.instance = null;
  }

  buildKey(tag: string): string {
    const hash = createHash('sha256')
      .update(`${this.version}:${tag}`)
      .digest('hex')
      .slice(0, 16);
    return `${KEY_PREFIX}${this.version}:${hash}`;
  }

  buildTagKey(tag: string): string {
    return `${TAG_PREFIX}${tag}`;
  }

  async get<T>(tag: string): Promise<T | null> {
    try {
      const key = this.buildKey(tag);
      const raw = await this.redis.get(key);
      if (!raw) {
        cacheMetrics.recordMiss();
        return null;
      }
      cacheMetrics.recordHit();
      return JSON.parse(raw) as T;
    } catch (err) {
      cacheMetrics.recordError();
      logger.warn({ err, tag }, 'cache get failed (non-critical)');
      return null;
    }
  }

  async setByTags(tags: string[], data: unknown, options: SetByTagsOptions): Promise<void> {
    if (tags.length === 0) return;
    const key = this.buildKey(tags[0]);
    const payload = JSON.stringify(data);

    try {
      const pipeline = this.redis.pipeline();
      const ttl = options.perTagTtl?.[tags[0]] ?? options.defaultTtl;
      pipeline.setex(key, ttl, payload);
      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        pipeline.sadd(tagKey, key);
        pipeline.expire(tagKey, ttl + TAG_SET_TTL_BUFFER_SEC);
      }
      await pipeline.exec();
      cacheMetrics.recordWrite();
    } catch (err) {
      cacheMetrics.recordError();
      logger.warn({ err, tags }, 'cache setByTags failed (non-critical)');
    }
  }

  async getTagMembers(tag: string): Promise<string[]> {
    try {
      const tagKey = this.buildTagKey(tag);
      return await this.redis.smembers(tagKey);
    } catch (err) {
      logger.warn({ err, tag }, 'cache getTagMembers failed (non-critical)');
      return [];
    }
  }

  async flushTags(tags: string[]): Promise<number> {
    if (tags.length === 0) return 0;
    const uniq = [...new Set(tags)];

    try {
      const allKeys: string[] = [];
      for (const tag of uniq) {
        allKeys.push(this.buildTagKey(tag));
        const members = await this.redis.smembers(this.buildTagKey(tag));
        allKeys.push(...members);
      }

      if (allKeys.length === 0) return 0;

      const CHUNK = 500;
      let deleted = 0;
      for (let i = 0; i < allKeys.length; i += CHUNK) {
        const chunk = allKeys.slice(i, i + CHUNK);
        const result = await this.redis.del(...chunk);
        deleted += result;
      }
      cacheMetrics.recordFlush(uniq.length);
      return deleted;
    } catch (err) {
      cacheMetrics.recordError();
      logger.warn({ err, tags: uniq }, 'cache flushTags failed (non-critical)');
      return 0;
    }
  }

  async scanAndDelete(pattern: string): Promise<number> {
    try {
      const stream = this.redis.scanStream({ match: pattern, count: 200 });
      const keys: string[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: string[]) => keys.push(...chunk));
        stream.on('end', () => resolve());
        stream.on('error', reject);
      });

      if (keys.length === 0) return 0;

      const CHUNK = 500;
      let deleted = 0;
      for (let i = 0; i < keys.length; i += CHUNK) {
        const chunk = keys.slice(i, i + CHUNK);
        const result = await this.redis.del(...chunk);
        deleted += result;
      }
      return deleted;
    } catch (err) {
      logger.warn({ err, pattern }, 'cache scanAndDelete failed (non-critical)');
      return 0;
    }
  }

  async getVersion(): Promise<string | null> {
    try {
      return await this.redis.get(`${KEY_PREFIX}version`);
    } catch {
      return null;
    }
  }

  async setVersion(version: string): Promise<void> {
    try {
      await this.redis.set(`${KEY_PREFIX}version`, version);
    } catch (err) {
      logger.warn({ err, version }, 'cache setVersion failed (non-critical)');
    }
  }

  async flushOldVersion(oldVersion: string): Promise<number> {
    const pattern = `${KEY_PREFIX}${oldVersion}:*`;
    const deleted = await this.scanAndDelete(pattern);
    const tagPattern = `${TAG_PREFIX}*`;
    const tagDeleted = await this.scanAndDelete(tagPattern);
    return deleted + tagDeleted;
  }
}
