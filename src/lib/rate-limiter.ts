/**
 * Rate limiter for API requests
 * Prevents abuse and provides usage feedback to users
 */

interface RateLimitEntry {
    timestamps: number[];
    lastCleanup: number;
}

export class RateLimiter {
    private static attempts: Map<string, RateLimitEntry> = new Map();
    private static MAX_REQUESTS = 15; // per window
    private static WINDOW_MS = 60 * 1000; // 1 minute
    private static CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if user can make a request
     */
    static canMakeRequest(userId: string): boolean {
        const entry = this.getEntry(userId);
        const now = Date.now();

        // Filter out timestamps outside the window
        const recentAttempts = entry.timestamps.filter(
            timestamp => now - timestamp < this.WINDOW_MS
        );

        return recentAttempts.length < this.MAX_REQUESTS;
    }

    /**
     * Record a request attempt
     */
    static recordRequest(userId: string): void {
        const entry = this.getEntry(userId);
        const now = Date.now();

        // Add current timestamp
        entry.timestamps.push(now);

        // Clean up old timestamps if needed
        if (now - entry.lastCleanup > this.CLEANUP_INTERVAL) {
            entry.timestamps = entry.timestamps.filter(
                timestamp => now - timestamp < this.WINDOW_MS
            );
            entry.lastCleanup = now;
        }

        this.attempts.set(userId, entry);

        console.log(`[RateLimiter] Recorded request for ${userId}. Total in window: ${this.getRequestCount(userId)}`);
    }

    /**
     * Get number of remaining requests in current window
     */
    static getRemainingRequests(userId: string): number {
        const count = this.getRequestCount(userId);
        return Math.max(0, this.MAX_REQUESTS - count);
    }

    /**
     * Get number of requests made in current window
     */
    static getRequestCount(userId: string): number {
        const entry = this.getEntry(userId);
        const now = Date.now();

        const recentAttempts = entry.timestamps.filter(
            timestamp => now - timestamp < this.WINDOW_MS
        );

        return recentAttempts.length;
    }

    /**
     * Get time until rate limit resets (in ms)
     */
    static getTimeUntilReset(userId: string): number {
        const entry = this.getEntry(userId);
        const now = Date.now();

        if (entry.timestamps.length === 0) return 0;

        const oldestInWindow = Math.min(...entry.timestamps.filter(
            timestamp => now - timestamp < this.WINDOW_MS
        ));

        const resetTime = oldestInWindow + this.WINDOW_MS;
        return Math.max(0, resetTime - now);
    }

    /**
     * Reset rate limit for a user (admin function)
     */
    static reset(userId: string): void {
        this.attempts.delete(userId);
        console.log(`[RateLimiter] Reset limits for ${userId}`);
    }

    /**
     * Clear all rate limit data
     */
    static clearAll(): void {
        this.attempts.clear();
        console.log('[RateLimiter] Cleared all rate limits');
    }

    /**
     * Get or create entry for user
     */
    private static getEntry(userId: string): RateLimitEntry {
        let entry = this.attempts.get(userId);

        if (!entry) {
            entry = {
                timestamps: [],
                lastCleanup: Date.now()
            };
            this.attempts.set(userId, entry);
        }

        return entry;
    }

    /**
     * Get rate limit configuration
     */
    static getConfig() {
        return {
            maxRequests: this.MAX_REQUESTS,
            windowMs: this.WINDOW_MS,
            windowMinutes: this.WINDOW_MS / 60000
        };
    }

    /**
     * Format time remaining for display
     */
    static formatTimeRemaining(ms: number): string {
        const seconds = Math.ceil(ms / 1000);

        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }

        const minutes = Math.ceil(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
}
