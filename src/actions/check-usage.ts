"use server";

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UsageInfo, createDefaultUsage, parseErrorForUsage } from '@/lib/llm/usage-tracker';

export interface CheckUsageResult {
    provider: 'groq' | 'gemini' | 'openai';
    status: 'ok' | 'warning' | 'error' | 'unknown';
    usage?: UsageInfo;
    message?: string;
}

const USAGE_CHECK_TIMEOUT = 5000; // 5 second timeout for usage checks

/**
 * Check Groq API usage by making a minimal request
 */
async function checkGroqUsage(apiKey: string): Promise<CheckUsageResult> {
    try {
        const client = new Groq({ apiKey });

        // Make a minimal request with timeout
        const requestPromise = client.chat.completions.create({
            messages: [{ role: 'user', content: 'hi' }],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), USAGE_CHECK_TIMEOUT)
        );

        await Promise.race([requestPromise, timeoutPromise]);

        // If we got here, the API is working
        const usage = createDefaultUsage('groq');
        return {
            provider: 'groq',
            status: 'ok',
            usage,
            message: 'API is working'
        };

    } catch (e: any) {
        const errorMsg = e.message || String(e);

        // Check if it's a rate limit error
        if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
            const usage = parseErrorForUsage('groq', errorMsg, apiKey);

            // Check if it's daily limit (TPD) or per-minute limit
            if (errorMsg.includes('tokens per day') || errorMsg.includes('TPD')) {
                return {
                    provider: 'groq',
                    status: 'error',
                    usage: usage || {
                        ...createDefaultUsage('groq'),
                        tokens: { used: 100000, limit: 100000, remaining: 0, percentUsed: 100 },
                        error: 'Daily limit reached'
                    },
                    message: 'Daily token limit reached. Resets at midnight UTC.'
                };
            }

            return {
                provider: 'groq',
                status: 'warning',
                usage: usage || createDefaultUsage('groq'),
                message: 'Rate limited. Wait a moment and try again.'
            };
        }

        // Check for invalid API key
        if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('invalid')) {
            return {
                provider: 'groq',
                status: 'error',
                message: 'Invalid API key'
            };
        }

        // Handle timeout
        if (errorMsg.includes('timed out')) {
            return {
                provider: 'groq',
                status: 'unknown',
                message: 'Check timed out - try again'
            };
        }

        return {
            provider: 'groq',
            status: 'unknown',
            message: errorMsg.substring(0, 100)
        };
    }
}

/**
 * Check Gemini API usage by making a minimal request
 */
async function checkGeminiUsage(apiKey: string): Promise<CheckUsageResult> {
    try {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });

        // Make a minimal request with timeout
        const requestPromise = model.generateContent('hi');
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), USAGE_CHECK_TIMEOUT)
        );

        await Promise.race([requestPromise, timeoutPromise]);

        return {
            provider: 'gemini',
            status: 'ok',
            usage: createDefaultUsage('gemini'),
            message: 'API is working'
        };

    } catch (e: any) {
        const errorMsg = e.message || String(e);

        // Check if it's a quota error
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
            const usage = parseErrorForUsage('gemini', errorMsg, apiKey);

            // Check if it's per-minute or per-day limit
            if (errorMsg.includes('PerDay') || errorMsg.includes('per day')) {
                return {
                    provider: 'gemini',
                    status: 'error',
                    usage: usage || {
                        ...createDefaultUsage('gemini'),
                        tokens: { used: 1000000, limit: 1000000, remaining: 0, percentUsed: 100 },
                        error: 'Daily limit reached'
                    },
                    message: 'Daily quota exceeded. Resets at midnight Pacific.'
                };
            }

            // Extract retry time if available
            const retryMatch = errorMsg.match(/retry in (\d+)/i);
            const retrySeconds = retryMatch ? parseInt(retryMatch[1]) : 60;

            return {
                provider: 'gemini',
                status: 'warning',
                usage: usage || createDefaultUsage('gemini'),
                message: `Rate limited. Try again in ${retrySeconds}s.`
            };
        }

        // Check for invalid API key
        if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('permission_denied')) {
            return {
                provider: 'gemini',
                status: 'error',
                message: 'Invalid API key'
            };
        }

        // Handle timeout
        if (errorMsg.includes('timed out')) {
            return {
                provider: 'gemini',
                status: 'unknown',
                message: 'Check timed out - try again'
            };
        }

        return {
            provider: 'gemini',
            status: 'unknown',
            message: errorMsg.substring(0, 100)
        };
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
    const results: CheckUsageResult[] = [];

    // Check in parallel
    const checks: Promise<CheckUsageResult>[] = [];

    if (apiKeys.groq) {
        checks.push(checkGroqUsage(apiKeys.groq));
    }

    if (apiKeys.gemini) {
        checks.push(checkGeminiUsage(apiKeys.gemini));
    }

    // OpenAI - placeholder for future implementation
    if (apiKeys.openai) {
        checks.push(Promise.resolve({
            provider: 'openai' as const,
            status: 'unknown' as const,
            message: 'Usage check not implemented for OpenAI'
        }));
    }

    const settledResults = await Promise.allSettled(checks);

    for (const result of settledResults) {
        if (result.status === 'fulfilled') {
            results.push(result.value);
        }
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
        return {
            provider,
            status: 'error',
            message: 'No API key configured'
        };
    }

    switch (provider) {
        case 'groq':
            return checkGroqUsage(apiKey);
        case 'gemini':
            return checkGeminiUsage(apiKey);
        case 'openai':
            return {
                provider: 'openai',
                status: 'unknown',
                message: 'Usage check not implemented'
            };
        default:
            return {
                provider,
                status: 'unknown',
                message: 'Unknown provider'
            };
    }
}
