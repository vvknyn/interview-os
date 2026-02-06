// Enhanced caching integration for DashboardContainer
// This file contains helper functions to integrate the new InterviewCache system

import { InterviewCache, CachedInterviewData } from "@/lib/interview-cache";
import { RateLimiter } from "@/lib/rate-limiter";
import { fetchServerCache, saveServerCache } from "@/actions/cache";

/**
 * Load cached interview data (checks client then server cache)
 */
export async function loadEnhancedCache(
    company: string,
    position: string,
    round: string
): Promise<any | null> {
    try {
        // 1. Try client cache first (fastest - localStorage)
        const cacheKey = InterviewCache.getCacheKey(company, position, round);
        let cached = InterviewCache.get(cacheKey);

        if (cached) {
            console.log('[EnhancedCache] Client cache hit:', cacheKey);
            return {
                timestamp: cached.createdAt,
                company: cached.company,
                position: cached.position,
                round: cached.round,
                hasContext: cached.hasResumeContext,
                reconData: cached.reconData,
                matchData: cached.matchData,
                questionsData: cached.questionsData,
                reverseData: cached.reverseData,
                technicalData: cached.technicalData,
                codingChallenge: cached.codingChallenge,
                systemDesignData: cached.systemDesignData
            };
        }

        // 2. Try server cache (slower but persists across sessions)
        const serverCached = await fetchServerCache(cacheKey);
        if (serverCached.data) {
            console.log('[EnhancedCache] Server cache hit:', cacheKey);
            // Populate client cache for faster subsequent access
            InterviewCache.set(serverCached.data);

            return {
                timestamp: serverCached.data.createdAt,
                company: serverCached.data.company,
                position: serverCached.data.position,
                round: serverCached.data.round,
                hasContext: serverCached.data.hasResumeContext,
                reconData: serverCached.data.reconData,
                matchData: serverCached.data.matchData,
                questionsData: serverCached.data.questionsData,
                reverseData: serverCached.data.reverseData,
                technicalData: serverCached.data.technicalData,
                codingChallenge: serverCached.data.codingChallenge,
                systemDesignData: serverCached.data.systemDesignData
            };
        }

        console.log('[EnhancedCache] Cache miss:', cacheKey);
        return null;
    } catch (e) {
        console.error('[EnhancedCache] Load error:', e);
        return null;
    }
}

/**
 * Save interview data to both client and server cache
 */
export async function saveEnhancedCache(
    company: string,
    position: string,
    round: string,
    data: {
        reconData?: any;
        matchData?: any;
        questionsData?: any;
        reverseData?: any;
        technicalData?: any;
        codingChallenge?: any;
        systemDesignData?: any;
    },
    hasResumeContext: boolean,
    resumeCompanies?: string[]
): Promise<void> {
    try {
        const cacheKey = InterviewCache.getCacheKey(company, position, round);
        const now = Date.now();

        const cachedData: CachedInterviewData = {
            cacheKey,
            company,
            position,
            round,
            hasResumeContext,
            createdAt: now,
            expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
            reconData: data.reconData,
            matchData: data.matchData,
            questionsData: data.questionsData,
            reverseData: data.reverseData,
            technicalData: data.technicalData,
            codingChallenge: data.codingChallenge,
            systemDesignData: data.systemDesignData,
            resumeCompanies: resumeCompanies || []
        };

        // Save to client cache (synchronous, localStorage)
        InterviewCache.set(cachedData);
        console.log('[EnhancedCache] Saved to client cache:', cacheKey);

        // Save to server cache (async, don't block)
        saveServerCache(cachedData).catch(e => {
            console.error('[EnhancedCache] Failed to save to server cache:', e);
        });
    } catch (e) {
        console.error('[EnhancedCache] Save error:', e);
    }
}

/**
 * Check if user can make an API request (rate limiting)
 */
export function canMakeRequest(userId: string): { allowed: boolean; message?: string } {
    if (!RateLimiter.canMakeRequest(userId)) {
        const remaining = RateLimiter.getTimeUntilReset(userId);
        const timeStr = RateLimiter.formatTimeRemaining(remaining);

        return {
            allowed: false,
            message: `Rate limit exceeded. Please wait ${timeStr} before searching again.`
        };
    }

    return { allowed: true };
}

/**
 * Record an API request (for rate limiting)
 */
export function recordRequest(userId: string): void {
    RateLimiter.recordRequest(userId);
    const remaining = RateLimiter.getRemainingRequests(userId);
    console.log(`[RateLimit] ${remaining} requests remaining this minute`);
}
