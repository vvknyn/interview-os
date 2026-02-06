/**
 * API Usage Tracker
 * Tracks token usage across providers to help users monitor their limits
 */

export interface UsageInfo {
    provider: 'groq' | 'gemini' | 'openai';
    tokens: {
        used: number;
        limit: number;
        remaining: number;
        percentUsed: number;
    };
    requests: {
        used: number;
        limit: number;
        remaining: number;
        percentUsed: number;
    };
    resetTime?: string; // When the quota resets
    lastUpdated: number;
    error?: string;
}

export interface RateLimitData {
    rpm: { used: number; limit: number };
    tpm: { used: number; limit: number };
    rpd: { used: number; limit: number };
    lastUpdated: number;
}

export interface UsageResponse {
    groq?: UsageInfo;
    gemini?: UsageInfo;
    openai?: UsageInfo;
}

// Server-side rate limit store (persists across requests in the same process)
const rateLimitStore = new Map<string, RateLimitData>();

/**
 * Store rate limit data fetched from API headers
 */
export function storeRateLimits(provider: string, data: RateLimitData): void {
    rateLimitStore.set(provider, data);
}

/**
 * Get stored rate limit data
 */
export function getStoredRateLimits(provider: string): RateLimitData | null {
    return rateLimitStore.get(provider) || null;
}

/**
 * Record a generation request to update usage counters
 */
export function recordGeneration(provider: string, tokensUsed: number): void {
    const current = rateLimitStore.get(provider);
    if (current) {
        current.rpm.used = Math.min(current.rpm.used + 1, current.rpm.limit);
        current.tpm.used = Math.min(current.tpm.used + tokensUsed, current.tpm.limit);
        current.rpd.used = Math.min(current.rpd.used + 1, current.rpd.limit);
        current.lastUpdated = Date.now();
    }
}

// In-memory cache for usage data (server-side)
const usageCache: Map<string, UsageInfo> = new Map();

/**
 * Update usage info from API response headers (Groq)
 */
export function updateUsageFromHeaders(
    provider: 'groq' | 'gemini' | 'openai',
    headers: Record<string, string | undefined>,
    apiKey: string
): UsageInfo | null {
    if (provider !== 'groq') return null;

    const cacheKey = `${provider}:${apiKey.substring(0, 10)}`;

    try {
        const limitTokens = parseInt(headers['x-ratelimit-limit-tokens'] || '0');
        const remainingTokens = parseInt(headers['x-ratelimit-remaining-tokens'] || '0');
        const limitRequests = parseInt(headers['x-ratelimit-limit-requests'] || '0');
        const remainingRequests = parseInt(headers['x-ratelimit-remaining-requests'] || '0');
        const resetTokens = headers['x-ratelimit-reset-tokens'];
        const resetRequests = headers['x-ratelimit-reset-requests'];

        // Calculate used tokens (limit - remaining)
        const usedTokens = limitTokens - remainingTokens;
        const usedRequests = limitRequests - remainingRequests;

        const usage: UsageInfo = {
            provider: 'groq',
            tokens: {
                used: usedTokens,
                limit: limitTokens,
                remaining: remainingTokens,
                percentUsed: limitTokens > 0 ? Math.round((usedTokens / limitTokens) * 100) : 0
            },
            requests: {
                used: usedRequests,
                limit: limitRequests,
                remaining: remainingRequests,
                percentUsed: limitRequests > 0 ? Math.round((usedRequests / limitRequests) * 100) : 0
            },
            resetTime: resetTokens || resetRequests,
            lastUpdated: Date.now()
        };

        usageCache.set(cacheKey, usage);
        return usage;
    } catch (e) {
        console.error('Failed to parse usage headers:', e);
        return null;
    }
}

/**
 * Get cached usage info
 */
export function getCachedUsage(provider: 'groq' | 'gemini' | 'openai', apiKey: string): UsageInfo | null {
    const cacheKey = `${provider}:${apiKey.substring(0, 10)}`;
    const cached = usageCache.get(cacheKey);

    // Return if cached within last 5 minutes
    if (cached && Date.now() - cached.lastUpdated < 5 * 60 * 1000) {
        return cached;
    }

    return null;
}

/**
 * Parse error message to extract usage info
 */
export function parseErrorForUsage(
    provider: 'groq' | 'gemini' | 'openai',
    errorMessage: string,
    apiKey: string
): UsageInfo | null {
    const cacheKey = `${provider}:${apiKey.substring(0, 10)}`;

    if (provider === 'groq') {
        // Parse Groq error: "Limit 100000, Used 99895, Requested 252"
        const limitMatch = errorMessage.match(/Limit\s+(\d+)/i);
        const usedMatch = errorMessage.match(/Used\s+(\d+)/i);

        if (limitMatch && usedMatch) {
            const limit = parseInt(limitMatch[1]);
            const used = parseInt(usedMatch[1]);
            const remaining = Math.max(0, limit - used);

            const usage: UsageInfo = {
                provider: 'groq',
                tokens: {
                    used,
                    limit,
                    remaining,
                    percentUsed: limit > 0 ? Math.round((used / limit) * 100) : 0
                },
                requests: { used: 0, limit: 0, remaining: 0, percentUsed: 0 },
                lastUpdated: Date.now(),
                error: 'Daily limit reached'
            };

            usageCache.set(cacheKey, usage);
            return usage;
        }
    }

    if (provider === 'gemini') {
        // Gemini error parsing - extract quota info if available
        const limitMatch = errorMessage.match(/limit:\s*(\d+)/i);

        if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            const usage: UsageInfo = {
                provider: 'gemini',
                tokens: { used: limit, limit, remaining: 0, percentUsed: 100 },
                requests: { used: limit, limit, remaining: 0, percentUsed: 100 },
                lastUpdated: Date.now(),
                error: 'Rate limit reached'
            };

            usageCache.set(cacheKey, usage);
            return usage;
        }
    }

    return null;
}

/**
 * Create default usage info for a provider
 */
export function createDefaultUsage(provider: 'groq' | 'gemini' | 'openai'): UsageInfo {
    const limits = {
        groq: { tokens: 100000, requests: 1000 },
        gemini: { tokens: 1000000, requests: 60 },
        openai: { tokens: 1000000, requests: 500 }
    };

    const providerLimits = limits[provider];

    return {
        provider,
        tokens: {
            used: 0,
            limit: providerLimits.tokens,
            remaining: providerLimits.tokens,
            percentUsed: 0
        },
        requests: {
            used: 0,
            limit: providerLimits.requests,
            remaining: providerLimits.requests,
            percentUsed: 0
        },
        lastUpdated: Date.now()
    };
}
