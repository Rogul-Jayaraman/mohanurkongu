interface CacheMetricsSnapshot {
  hits: number;
  misses: number;
  hitRate: number;
  total: number;
  errors: number;
  writes: number;
  flushes: number;
  tagsFlushed: number;
}

class CacheMetricsTracker {
  private hits = 0;
  private misses = 0;
  private errors = 0;
  private writes = 0;
  private flushes = 0;
  private tagsFlushed = 0;

  recordHit(): void {
    this.hits += 1;
  }

  recordMiss(): void {
    this.misses += 1;
  }

  recordError(): void {
    this.errors += 1;
  }

  recordWrite(): void {
    this.writes += 1;
  }

  recordFlush(tagCount: number): void {
    this.flushes += 1;
    this.tagsFlushed += tagCount;
  }

  snapshot(): CacheMetricsSnapshot {
    const total = this.hits + this.misses;
    const hitRate = total === 0 ? 0 : this.hits / total;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      total,
      errors: this.errors,
      writes: this.writes,
      flushes: this.flushes,
      tagsFlushed: this.tagsFlushed,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.writes = 0;
    this.flushes = 0;
    this.tagsFlushed = 0;
  }
}

export const cacheMetrics = new CacheMetricsTracker();
export type { CacheMetricsSnapshot };
