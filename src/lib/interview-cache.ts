/**
 * Client-side caching for interview preparation data
 * Provides instant loading for repeated searches
 */

export interface CachedInterviewData {
    // Cache metadata
    cacheKey: string;
    company: string;
    position: string;
    round: string;
    hasResumeContext: boolean;
    createdAt: number;
    expiresAt: number;

    // Cached content
    reconData?: any;
    matchData?: any;
    questionsData?: any;
    reverseData?: any;
    technicalData?: any;
    codingChallenge?: any;
    systemDesignData?: any;
    resumeCompanies?: string[];
}

export class InterviewCache {
    private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    private static STORAGE_KEY = 'interview_prep_cache';
    private static cache: Map<string, CachedInterviewData> = new Map();
    private static initialized = false;

    /**
     * Initialize cache from localStorage
     */
    private static init() {
        if (this.initialized) return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                Object.entries(parsed).forEach(([key, value]) => {
                    this.cache.set(key, value as CachedInterviewData);
                });
            }
        } catch (e) {
            console.error('[InterviewCache] Failed to load cache:', e);
        }

        this.initialized = true;
    }

    /**
     * Persist cache to localStorage
     */
    private static persist() {
        try {
            const obj: Record<string, CachedInterviewData> = {};
            this.cache.forEach((value, key) => {
                obj[key] = value;
            });
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {
            console.error('[InterviewCache] Failed to persist cache:', e);
        }
    }

    /**
     * Generate cache key from search parameters
     */
    static getCacheKey(company: string, position: string, round: string): string {
        const normalized = `${company.toLowerCase()}_${position.toLowerCase()}_${round.toLowerCase()}`;
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `${Math.abs(hash).toString(36)}_${normalized.substring(0, 20)}`;
    }

    /**
     * Get cached data if available and not expired
     */
    static get(cacheKey: string): CachedInterviewData | null {
        this.init();

        const cached = this.cache.get(cacheKey);
        if (!cached) return null;

        if (this.isExpired(cached.expiresAt)) {
            this.cache.delete(cacheKey);
            this.persist();
            return null;
        }

        console.log('[InterviewCache] Cache hit:', cacheKey);
        return cached;
    }

    /**
     * Store data in cache
     */
    static set(data: CachedInterviewData): void {
        this.init();

        const now = Date.now();
        data.createdAt = now;
        data.expiresAt = now + this.CACHE_DURATION;

        this.cache.set(data.cacheKey, data);
        this.persist();

        console.log('[InterviewCache] Data cached:', data.cacheKey, 'expires:', new Date(data.expiresAt));
    }

    /**
     * Check if timestamp is expired
     */
    static isExpired(expiresAt: number): boolean {
        return Date.now() > expiresAt;
    }

    /**
     * Clear all cached data
     */
    static clear(): void {
        this.init();
        this.cache.clear();
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[InterviewCache] Cache cleared');
    }

    /**
     * Clear cache for specific search
     */
    static clearKey(cacheKey: string): void {
        this.init();
        this.cache.delete(cacheKey);
        this.persist();
        console.log('[InterviewCache] Cleared cache for:', cacheKey);
    }

    /**
     * Get all cache keys (for debugging)
     */
    static getAllKeys(): string[] {
        this.init();
        return Array.from(this.cache.keys());
    }

    /**
     * Clean up expired entries
     */
    static cleanup(): void {
        this.init();

        let cleaned = 0;
        this.cache.forEach((value, key) => {
            if (this.isExpired(value.expiresAt)) {
                this.cache.delete(key);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            this.persist();
            console.log(`[InterviewCache] Cleaned up ${cleaned} expired entries`);
        }
    }

    /**
     * Get cache statistics
     */
    static getStats() {
        this.init();

        const entries = Array.from(this.cache.values());
        const now = Date.now();

        return {
            total: entries.length,
            expired: entries.filter(e => this.isExpired(e.expiresAt)).length,
            active: entries.filter(e => !this.isExpired(e.expiresAt)).length,
            oldestEntry: entries.length > 0
                ? Math.min(...entries.map(e => e.createdAt))
                : null,
            newestEntry: entries.length > 0
                ? Math.max(...entries.map(e => e.createdAt))
                : null
        };
    }
}

// Run cleanup on initialization
if (typeof window !== 'undefined') {
    InterviewCache.cleanup();
}
