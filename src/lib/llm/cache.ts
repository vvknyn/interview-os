/**
 * LLM Result Cache Manager
 * 
 * Caches LLM-generated content to dramatically reduce API calls.
 * Results are stored until user explicitly regenerates.
 */

export interface CachedResult {
    key: string;
    result: any;
    timestamp: number;
    provider: string;
    model?: string;
}

class LLMCacheManager {
    private readonly STORAGE_PREFIX = 'llm_cache_';
    private readonly DB_TABLE = 'llm_cache';

    /**
     * Generate a cache key from context
     */
    private generateKey(context: Record<string, any>): string {
        // Sort keys for consistency
        const sorted = Object.keys(context).sort().reduce((acc, key) => {
            acc[key] = context[key];
            return acc;
        }, {} as Record<string, any>);

        return JSON.stringify(sorted);
    }

    /**
     * Hash a string to create a shorter key
     */
    private hashKey(key: string): string {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get cached result if exists and valid
     */
    async get(context: Record<string, any>): Promise<any | null> {
        const key = this.generateKey(context);
        const hashedKey = this.hashKey(key);

        // Try localStorage first (faster)
        try {
            const stored = localStorage.getItem(this.STORAGE_PREFIX + hashedKey);
            if (stored) {
                const cached: CachedResult = JSON.parse(stored);
                console.log(`[LLMCache] HIT for ${hashedKey.substring(0, 8)}...`);
                return cached.result;
            }
        } catch (e) {
            console.error("[LLMCache] localStorage error:", e);
        }

        console.log(`[LLMCache] MISS for ${hashedKey.substring(0, 8)}...`);
        return null;
    }

    /**
     * Store result in cache
     */
    async set(context: Record<string, any>, result: any, provider: string, model?: string): Promise<void> {
        const key = this.generateKey(context);
        const hashedKey = this.hashKey(key);

        const cached: CachedResult = {
            key: hashedKey,
            result,
            timestamp: Date.now(),
            provider,
            model
        };

        // Store in localStorage
        try {
            localStorage.setItem(this.STORAGE_PREFIX + hashedKey, JSON.stringify(cached));
            console.log(`[LLMCache] STORED ${hashedKey.substring(0, 8)}... (${provider})`);
        } catch (e) {
            console.error("[LLMCache] Failed to cache:", e);
        }
    }

    /**
     * Invalidate (delete) a cached result
     */
    async invalidate(context: Record<string, any>): Promise<void> {
        const key = this.generateKey(context);
        const hashedKey = this.hashKey(key);

        localStorage.removeItem(this.STORAGE_PREFIX + hashedKey);
        console.log(`[LLMCache] INVALIDATED ${hashedKey.substring(0, 8)}...`);
    }

    /**
     * Clear all cache
     */
    async clearAll(): Promise<void> {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.STORAGE_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
        console.log(`[LLMCache] CLEARED ${keys.length} entries`);
    }

    /**
     * Get cache statistics
     */
    getStats(): { count: number; totalSize: number } {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.STORAGE_PREFIX));
        const totalSize = keys.reduce((sum, key) => {
            return sum + (localStorage.getItem(key)?.length || 0);
        }, 0);

        return {
            count: keys.length,
            totalSize
        };
    }
}

// Singleton
export const llmCache = new LLMCacheManager();
