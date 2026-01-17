import { LRUCache } from 'lru-cache';
import { GitHubSignals, RoastResult } from '../types';

export class GitHubCache {
  private cache: LRUCache<string, GitHubSignals>;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default 5 minutes TTL
    this.cache = new LRUCache<string, GitHubSignals>({
      max: 100,
      ttl: ttlMs,
    });
  }

  getKey(username: string, maxRepos: number, includeReadme: boolean): string {
    return `${username}:${maxRepos}:${includeReadme}`;
  }

  get(username: string, maxRepos: number, includeReadme: boolean): GitHubSignals | undefined {
    return this.cache.get(this.getKey(username, maxRepos, includeReadme));
  }

  set(username: string, maxRepos: number, includeReadme: boolean, data: GitHubSignals): void {
    this.cache.set(this.getKey(username, maxRepos, includeReadme), data);
  }
}

export class OpenAIResultCache {
  private cache: LRUCache<string, RoastResult>;

  constructor(ttlMs: number = 10 * 60 * 1000) {
    // Default 10 minutes TTL
    this.cache = new LRUCache<string, RoastResult>({
      max: 100,
      ttl: ttlMs,
    });
  }

  getKey(username: string, intensity: string): string {
    return `${username}:${intensity}`;
  }

  get(username: string, intensity: string): RoastResult | undefined {
    return this.cache.get(this.getKey(username, intensity));
  }

  set(username: string, intensity: string, data: RoastResult): void {
    this.cache.set(this.getKey(username, intensity), data);
  }
}
