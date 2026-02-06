"use server";

import { UsageInfo, RateLimitData, createDefaultUsage, parseErrorForUsage, storeRateLimits, getStoredRateLimits } from '@/lib/llm/usage-tracker';

export interface CheckUsageResult {
    provider: 'groq' | 'gemini' | 'openai';
    status: 'ok' | 'warning' | 'error' | 'unknown';
    usage?: UsageInfo;
    rateLimits?: RateLimitData;
    message?: string;
}

const USAGE_CHECK_TIMEOUT = 8000;

// Known free tier defaults (approximate, vary by account)
const FREE_TIER_DEFAULTS: Record<string, RateLimitData> = {
    groq: { rpm: { used: 0, limit: 30 }, tpm: { used: 0, limit: 6000 }, rpd: { used: 0, limit: 14400 }, lastUpdated: 0 },
    gemini: { rpm: { used: 0, limit: 10 }, tpm: { used: 0, limit: 250000 }, rpd: { used: 0, limit: 50 }, lastUpdated: 0 },
    openai: { rpm: { used: 0, limit: 500 }, tpm: { used: 0, limit: 200000 }, rpd: { used: 0, limit: 10000 }, lastUpdated: 0 },
};

/**
 * Parse rate limit headers from HTTP response.
 */
function parseRateLimitHeaders(headers: Headers, provider: string): RateLimitData | null {
    const get = (name: string) => {
        const val = headers.get(name);
        return val ? parseInt(val, 10) : null;
    };

    let rpm_limit: number | null = null;
    let rpm_remaining: number | null = null;
    let tpm_limit: number | null = null;
    let tpm_remaining: number | null = null;
    let rpd_limit: number | null = null;
    let rpd_remaining: number | null = null;

    // Try multiple header naming conventions
    rpm_limit = get('x-ratelimit-limit-requests') ?? get('x-ratelimit-limit-requests-per-minute');
    rpm_remaining = get('x-ratelimit-remaining-requests') ?? get('x-ratelimit-remaining-requests-per-minute');
    tpm_limit = get('x-ratelimit-limit-tokens') ?? get('x-ratelimit-limit-tokens-per-minute');
    tpm_remaining = get('x-ratelimit-remaining-tokens') ?? get('x-ratelimit-remaining-tokens-per-minute');
    rpd_limit = get('x-ratelimit-limit-requests-per-day');
    rpd_remaining = get('x-ratelimit-remaining-requests-per-day');

    if (rpm_limit !== null || tpm_limit !== null || rpd_limit !== null) {
        return {
            rpm: {
                used: (rpm_limit !== null && rpm_remaining !== null) ? rpm_limit - rpm_remaining : 0,
                limit: rpm_limit ?? 0
            },
            tpm: {
                used: (tpm_limit !== null && tpm_remaining !== null) ? tpm_limit - tpm_remaining : 0,
                limit: tpm_limit ?? 0
            },
            rpd: {
                used: (rpd_limit !== null && rpd_remaining !== null) ? rpd_limit - rpd_remaining : 0,
                limit: rpd_limit ?? 0
            },
            lastUpdated: Date.now()
        };
    }

    return null;
}

/**
 * Get rate limit data: from headers if available, otherwise from stored data or defaults.
 * Merges in tracked usage from recordGeneration() calls.
 */
function getRateLimitsWithFallback(provider: string, headers: Headers | null): RateLimitData {
    // Try headers first
    if (headers) {
        const fromHeaders = parseRateLimitHeaders(headers, provider);
        if (fromHeaders) {
            storeRateLimits(provider, fromHeaders);
            return fromHeaders;
        }
    }

    // Try stored data (from previous checks or recordGeneration)
    const stored = getStoredRateLimits(provider);
    if (stored && stored.lastUpdated > 0) {
        return stored;
    }

    // Fall back to known defaults
    const defaults = { ...FREE_TIER_DEFAULTS[provider] || FREE_TIER_DEFAULTS.gemini, lastUpdated: Date.now() };
    defaults.rpm = { ...defaults.rpm };
    defaults.tpm = { ...defaults.tpm };
    defaults.rpd = { ...defaults.rpd };
    storeRateLimits(provider, defaults);
    return defaults;
}

/**
 * Check Groq API - uses a minimal completion to get rate limit headers
 */
async function checkGroqUsage(apiKey: string): Promise<CheckUsageResult> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), USAGE_CHECK_TIMEOUT);

        // Minimal completion call to get rate limit headers
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const rateLimits = getRateLimitsWithFallback('groq', response.headers);

        if (response.ok) {
            return {
                provider: 'groq',
                status: 'ok',
                usage: createDefaultUsage('groq'),
                rateLimits,
                message: 'API key valid'
            };
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText || '';

        if (response.status === 429 || errorMsg.includes('rate limit')) {
            const usage = parseErrorForUsage('groq', errorMsg, apiKey);

            if (errorMsg.includes('tokens per day') || errorMsg.includes('TPD')) {
                return {
                    provider: 'groq',
                    status: 'error',
                    usage: usage || { ...createDefaultUsage('groq'), tokens: { used: 100000, limit: 100000, remaining: 0, percentUsed: 100 }, error: 'Daily limit reached' },
                    rateLimits,
                    message: 'Daily token limit reached. Resets at midnight UTC.'
                };
            }

            return {
                provider: 'groq',
                status: 'warning',
                usage: usage || createDefaultUsage('groq'),
                rateLimits,
                message: 'Rate limited. Wait a moment and try again.'
            };
        }

        if (response.status === 401 || errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
            return { provider: 'groq', status: 'error', message: 'Invalid API key' };
        }

        return { provider: 'groq', status: 'unknown', rateLimits, message: errorMsg.substring(0, 100) };

    } catch (e: any) {
        const errorMsg = e.message || String(e);
        if (e.name === 'AbortError' || errorMsg.includes('timed out')) {
            return { provider: 'groq', status: 'unknown', message: 'Check timed out - try again' };
        }
        return { provider: 'groq', status: 'unknown', message: errorMsg.substring(0, 100) };
    }
}

/**
 * Check Gemini API - validates key, then makes a minimal generation call.
 * Falls back to known defaults if rate limit headers aren't available.
 */
async function checkGeminiUsage(apiKey: string): Promise<CheckUsageResult> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), USAGE_CHECK_TIMEOUT);

        // First validate the key with the models endpoint (no tokens consumed)
        const modelsResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { signal: controller.signal }
        );

        if (!modelsResponse.ok) {
            clearTimeout(timeoutId);
            const errorData = await modelsResponse.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || modelsResponse.statusText || '';

            if (modelsResponse.status === 400 || modelsResponse.status === 403 ||
                errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('permission_denied')) {
                return { provider: 'gemini', status: 'error', message: 'Invalid API key' };
            }

            if (modelsResponse.status === 429 || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
                const usage = parseErrorForUsage('gemini', errorMsg, apiKey);
                const rateLimits = getRateLimitsWithFallback('gemini', modelsResponse.headers);
                return {
                    provider: 'gemini', status: 'warning',
                    usage: usage || createDefaultUsage('gemini'),
                    rateLimits,
                    message: 'Rate limited.'
                };
            }

            return { provider: 'gemini', status: 'unknown', message: errorMsg.substring(0, 100) || 'Unknown error' };
        }

        // Key is valid - make a minimal generateContent call to try getting rate limit headers
        const genController = new AbortController();
        const genTimeoutId = setTimeout(() => genController.abort(), USAGE_CHECK_TIMEOUT);

        const genResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'hi' }] }],
                    generationConfig: { maxOutputTokens: 1 }
                }),
                signal: genController.signal
            }
        );

        clearTimeout(timeoutId);
        clearTimeout(genTimeoutId);

        // Try to get rate limits from headers, fall back to defaults
        const rateLimits = getRateLimitsWithFallback('gemini', genResponse.headers);

        if (genResponse.status === 429) {
            return {
                provider: 'gemini', status: 'warning',
                usage: createDefaultUsage('gemini'),
                rateLimits,
                message: 'Rate limited. Wait a moment and try again.'
            };
        }

        return {
            provider: 'gemini',
            status: 'ok',
            usage: createDefaultUsage('gemini'),
            rateLimits,
            message: 'API key valid'
        };

    } catch (e: any) {
        const errorMsg = e.message || String(e);
        if (e.name === 'AbortError' || errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
            return {
                provider: 'gemini', status: 'unknown',
                rateLimits: getRateLimitsWithFallback('gemini', null),
                message: 'Check timed out - try again'
            };
        }
        return { provider: 'gemini', status: 'unknown', message: errorMsg.substring(0, 100) };
    }
}

/**
 * Check usage for all configured providers
 */
export async function checkAllUsage(apiKeys: {
    groq?: string;
    gemini?: string;
    openai?: string;
}): Promise<CheckUsageResult[]> {
    const checks: Promise<CheckUsageResult>[] = [];
    if (apiKeys.groq) checks.push(checkGroqUsage(apiKeys.groq));
    if (apiKeys.gemini) checks.push(checkGeminiUsage(apiKeys.gemini));
    if (apiKeys.openai) {
        checks.push(Promise.resolve({
            provider: 'openai' as const, status: 'unknown' as const,
            rateLimits: getRateLimitsWithFallback('openai', null),
            message: 'Usage check not implemented for OpenAI'
        }));
    }

    const results: CheckUsageResult[] = [];
    const settledResults = await Promise.allSettled(checks);
    for (const result of settledResults) {
        if (result.status === 'fulfilled') results.push(result.value);
    }
    return results;
}

/**
 * Quick check for a single provider
 */
export async function checkProviderUsage(
    provider: 'groq' | 'gemini' | 'openai',
    apiKey: string
): Promise<CheckUsageResult> {
    if (!apiKey || apiKey.trim() === '') {
        return { provider, status: 'error', message: 'No API key configured' };
    }

    switch (provider) {
        case 'groq': return checkGroqUsage(apiKey);
        case 'gemini': return checkGeminiUsage(apiKey);
        case 'openai': return {
            provider: 'openai', status: 'unknown',
            rateLimits: getRateLimitsWithFallback('openai', null),
            message: 'Usage check not implemented'
        };
        default: return { provider, status: 'unknown', message: 'Unknown provider' };
    }
}
