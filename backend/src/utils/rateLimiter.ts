import { LRUCache } from 'lru-cache';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60 * 1000) {
    // Default: 10 requests per minute per IP
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.cache = new LRUCache<string, RateLimitEntry>({
      max: 1000,
      ttl: windowMs,
    });
  }

  check(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
    const entry = this.cache.get(ip);
    const now = Date.now();

    if (!entry || now > entry.resetAt) {
      // New window
      const resetAt = now + this.windowMs;
      this.cache.set(ip, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count++;
    this.cache.set(ip, entry);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }
}
