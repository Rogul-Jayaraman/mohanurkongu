import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheManager } from '../../common/cache/CacheManager.js';
import { buildProfileTag, buildAuthMeTag, CacheTtls } from '../../common/cache/cacheKeys.js';
import { getRedisClient, disconnectRedis } from '../../services/redis.js';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  const testTag = `test:profile:${Date.now()}`;

  beforeEach(async () => {
    const redis = getRedisClient();
    cacheManager = new CacheManager(redis, 'vtest');
  });

  afterEach(async () => {
    await cacheManager.flushTags([testTag]);
  });

  it('writes and reads data under a single tag', async () => {
    const data = { name: 'John', age: 30 };
    await cacheManager.setByTags([testTag], data, { defaultTtl: 60 });
    const result = await cacheManager.get(testTag);
    expect(result).toEqual(data);
  });

  it('returns null on cache miss', async () => {
    const result = await cacheManager.get(`nonexistent:${Date.now()}`);
    expect(result).toBeNull();
  });

  it('flushes all keys for a given tag', async () => {
    const tag1 = `${testTag}:a`;
    const tag2 = `${testTag}:b`;
    await cacheManager.setByTags([tag1], { x: 1 }, { defaultTtl: 60 });
    await cacheManager.setByTags([tag2], { y: 2 }, { defaultTtl: 60 });

    const r1 = await cacheManager.get(tag1);
    const r2 = await cacheManager.get(tag2);
    expect(r1).toEqual({ x: 1 });
    expect(r2).toEqual({ y: 2 });

    const deleted = await cacheManager.flushTags([tag1, tag2]);
    expect(deleted).toBeGreaterThan(0);

    const r1After = await cacheManager.get(tag1);
    const r2After = await cacheManager.get(tag2);
    expect(r1After).toBeNull();
    expect(r2After).toBeNull();
  });

  it('handles JSON parse failures gracefully', async () => {
    const redis = getRedisClient();
    const key = cacheManager.buildKey(testTag);
    await redis.set(key, 'not-valid-json{', 'EX', 60);
    const result = await cacheManager.get(testTag);
    expect(result).toBeNull();
  });

  it('produces stable keys for the same tag + version', () => {
    const key1 = cacheManager.buildKey('profile:abc');
    const key2 = cacheManager.buildKey('profile:abc');
    expect(key1).toBe(key2);
  });

  it('produces different keys for different versions', () => {
    const cm1 = new CacheManager(getRedisClient(), 'v1');
    const cm2 = new CacheManager(getRedisClient(), 'v2');
    const key1 = cm1.buildKey('profile:abc');
    const key2 = cm2.buildKey('profile:abc');
    expect(key1).not.toBe(key2);
  });

  it('respects per-tag TTL when set', async () => {
    const shortTtlTag = `${testTag}:short`;
    await cacheManager.setByTags(
      [shortTtlTag],
      { z: 1 },
      { defaultTtl: 60, perTagTtl: { [shortTtlTag]: 2 } },
    );
    const tagKey = cacheManager.buildTagKey(shortTtlTag);
    const redis = getRedisClient();
    const ttl = await redis.ttl(tagKey);
    expect(ttl).toBeLessThanOrEqual(2 + 60);
  });
});

describe('Cache key builders', () => {
  it('builds correct tag strings', () => {
    expect(buildProfileTag('abc-123')).toBe('profile:abc-123');
    expect(buildAuthMeTag('user-1')).toBe('account:user-1:auth-me');
  });

  it('exports TTL constants', () => {
    expect(CacheTtls.PROFILE_DETAIL).toBe(300);
    expect(CacheTtls.AUTH_ME).toBe(60);
    expect(CacheTtls.SHOWCASE).toBe(1800);
  });
});
