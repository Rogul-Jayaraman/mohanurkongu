import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../../common/cache/CacheManager.js';
import { buildProfileTag, CacheTtls } from '../../common/cache/cacheKeys.js';
import { cacheMetrics } from '../../common/cache/cacheMetrics.js';
import { getRedisClient, disconnectRedis } from '../../services/redis.js';

describe('Cache flow E2E', () => {
  let cm: CacheManager;
  const testProfileId = `e2e-${Date.now()}`;
  const tag = buildProfileTag(testProfileId);

  beforeEach(async () => {
    cm = new CacheManager(getRedisClient(), 've2e');
    cacheMetrics.reset();
  });

  afterAll(async () => {
    await cm.flushTags([tag]);
    await disconnectRedis();
  });

  it('round-trips a profile through cache, then invalidates via tag', async () => {
    const raw = { id: testProfileId, name: 'Test', canViewFullProfile: true, contactLocked: false };
    await cm.setByTags([tag], raw, { defaultTtl: CacheTtls.PROFILE_DETAIL });
    const hit = await cm.get(tag);
    expect(hit).toEqual(raw);

    const deleted = await cm.flushTags([tag]);
    expect(deleted).toBeGreaterThan(0);
    const after = await cm.get(tag);
    expect(after).toBeNull();
  });

  it('records hit and miss metrics correctly', async () => {
    await cm.setByTags([tag], { x: 1 }, { defaultTtl: 60 });
    await cm.get(tag);
    await cm.get(tag);
    await cm.get(`nope:${Date.now()}`);

    const snap = cacheMetrics.snapshot();
    expect(snap.hits).toBe(2);
    expect(snap.misses).toBe(1);
    expect(snap.hitRate).toBeCloseTo(2 / 3, 2);
    expect(snap.writes).toBeGreaterThanOrEqual(1);
  });

  it('different versions produce different keys (no cross-version read)', async () => {
    const cm1 = new CacheManager(getRedisClient(), 'va');
    const cm2 = new CacheManager(getRedisClient(), 'vb');
    const t = `iso:${Date.now()}`;

    await cm1.setByTags([t], { source: 'a' }, { defaultTtl: 60 });
    expect(await cm1.get(t)).toEqual({ source: 'a' });
    expect(await cm2.get(t)).toBeNull();
  });

  it('handles concurrent writes without race conditions', async () => {
    const t = `race:${Date.now()}`;
    const writes = Array.from({ length: 10 }, (_, i) =>
      cm.setByTags([t], { value: i }, { defaultTtl: 60 }),
    );
    await Promise.all(writes);
    const result = await cm.get(t);
    expect(result).toBeDefined();
    expect(typeof (result as any).value).toBe('number');
  });
});
