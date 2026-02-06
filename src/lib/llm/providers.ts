
import { LLMProvider, LLMRequest, LLMResponse } from './types';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { recordGeneration } from './usage-tracker';

// Default timeout for all LLM requests (60 seconds)
const DEFAULT_TIMEOUT_MS = 60000;

// Error codes for categorization
export enum LLMErrorCode {
    TIMEOUT = 'TIMEOUT',
    RATE_LIMIT = 'RATE_LIMIT',
    INVALID_KEY = 'INVALID_KEY',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
    CONTENT_BLOCKED = 'CONTENT_BLOCKED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PROVIDER_ERROR = 'PROVIDER_ERROR',
    UNKNOWN = 'UNKNOWN'
}

export interface LLMErrorInfo {
    code: LLMErrorCode;
    message: string;
    provider: string;
    model?: string;
    retryable: boolean;
    suggestModelSwitch: boolean;
}

// Helper to create a timeout promise
function createTimeoutPromise(ms: number, provider: string): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`[${provider}] Request timed out after ${ms / 1000}s. The API may be slow or unresponsive.`));
        }, ms);
    });
}

// Helper to wrap a promise with a timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, provider: string): Promise<T> {
    return Promise.race([
        promise,
        createTimeoutPromise(timeoutMs, provider)
    ]);
}

// Helper to categorize errors
function categorizeError(error: any, provider: string, model?: string): LLMErrorInfo {
    const message = error?.message || String(error);
    const lowerMessage = message.toLowerCase();

    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
        return {
            code: LLMErrorCode.TIMEOUT,
            message: `Request to ${provider} timed out. Please try again.`,
            provider,
            model,
            retryable: true,
            suggestModelSwitch: true
        };
    }

    // Rate limit errors
    if (lowerMessage.includes('429') || lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
        return {
            code: LLMErrorCode.RATE_LIMIT,
            message: `${provider} rate limit reached. Please wait a moment and try again, or switch to a different model.`,
            provider,
            model,
            retryable: true,
            suggestModelSwitch: true
        };
    }

    // Invalid API key
    if (lowerMessage.includes('401') || lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('invalid') && lowerMessage.includes('key') ||
        lowerMessage.includes('api_key_invalid') || lowerMessage.includes('permission_denied')) {
        return {
            code: LLMErrorCode.INVALID_KEY,
            message: `Invalid ${provider} API key. Please check your API key in Settings.`,
            provider,
            model,
            retryable: false,
            suggestModelSwitch: true
        };
    }

    // Quota exceeded (Gemini specific)
    if (lowerMessage.includes('quota') || lowerMessage.includes('resource_exhausted')) {
        return {
            code: LLMErrorCode.QUOTA_EXCEEDED,
            message: `${provider} quota exceeded. Try a different model or wait for quota reset.`,
            provider,
            model,
            retryable: false,
            suggestModelSwitch: true
        };
    }

    // Model not found
    if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist') ||
        lowerMessage.includes('invalid model') || lowerMessage.includes('model_not_found')) {
        return {
            code: LLMErrorCode.MODEL_NOT_FOUND,
            message: `Model "${model}" not available for ${provider}. Trying alternative models...`,
            provider,
            model,
            retryable: true,
            suggestModelSwitch: true
        };
    }

    // Content blocked
    if (lowerMessage.includes('content') && (lowerMessage.includes('blocked') || lowerMessage.includes('safety'))) {
        return {
            code: LLMErrorCode.CONTENT_BLOCKED,
            message: `Content was blocked by ${provider}'s safety filters. Please try rephrasing your request.`,
            provider,
            model,
            retryable: false,
            suggestModelSwitch: false
        };
    }

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('enotfound') || lowerMessage.includes('fetch failed')) {
        return {
            code: LLMErrorCode.NETWORK_ERROR,
            message: `Network error connecting to ${provider}. Please check your internet connection.`,
            provider,
            model,
            retryable: true,
            suggestModelSwitch: false
        };
    }

    // Default provider error
    return {
        code: LLMErrorCode.PROVIDER_ERROR,
        message: `${provider} error: ${message}`,
        provider,
        model,
        retryable: true,
        suggestModelSwitch: true
    };
}

// Format error for user-facing display
function formatErrorMessage(errorInfo: LLMErrorInfo): string {
    let msg = errorInfo.message;
    if (errorInfo.suggestModelSwitch && errorInfo.code !== LLMErrorCode.CONTENT_BLOCKED) {
        msg += ' Consider switching to a different provider if the issue persists.';
    }
    return msg;
}

export class GroqProvider implements LLMProvider {
    private client: Groq;
    private model: string;
    private static lastRequestTime: number = 0;
    private static minRequestInterval: number = 1000; // 1 second between requests

    constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Groq API key is required');
        }
        this.client = new Groq({ apiKey });
        this.model = model;
    }

    private async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - GroqProvider.lastRequestTime;
        if (timeSinceLastRequest < GroqProvider.minRequestInterval) {
            const waitTime = GroqProvider.minRequestInterval - timeSinceLastRequest;
            console.log(`[Groq] Rate limit protection: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        GroqProvider.lastRequestTime = Date.now();
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const maxRetries = 3;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await this.waitForRateLimit();
                console.log(`[Groq] Generating with model: ${this.model}${attempt > 0 ? ` (retry ${attempt})` : ''}`);

                const completionPromise = this.client.chat.completions.create({
                    messages: [
                        { role: 'system', content: request.system || 'You are a helpful assistant.' },
                        { role: 'user', content: request.prompt }
                    ],
                    model: this.model,
                    response_format: request.json ? { type: 'json_object' } : undefined
                });

                const completion = await withTimeout(completionPromise, DEFAULT_TIMEOUT_MS, 'Groq');

                const text = completion.choices[0]?.message?.content || "";

                if (!text || text.trim() === '') {
                    return { text: "", error: "Groq returned an empty response. Please try again." };
                }

                const tokensUsed = completion.usage?.total_tokens || 0;
                recordGeneration('groq', tokensUsed);

                console.log(`[Groq] Successfully generated ${text.length} characters`);
                return { text };

            } catch (e: any) {
                lastError = e;
                console.error(`[Groq] Error (attempt ${attempt + 1}/${maxRetries}):`, e.message);

                // Check if it's a rate limit error
                const errorInfo = categorizeError(e, 'Groq', this.model);

                if (errorInfo.code === LLMErrorCode.RATE_LIMIT) {
                    // Extract retry-after from headers if available
                    const retryAfter = e.headers?.['retry-after'];
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 5000;

                    // Only retry if it's RPM/RPS limit, not daily limit
                    if (e.message?.includes('tokens per day') || e.message?.includes('TPD')) {
                        // Daily limit - don't retry, fail immediately
                        return { text: "", error: "Groq daily token limit reached. Please switch to Gemini or try again tomorrow." };
                    }

                    if (attempt < maxRetries - 1) {
                        console.log(`[Groq] Rate limited, waiting ${waitTime}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        GroqProvider.minRequestInterval = Math.min(GroqProvider.minRequestInterval * 1.5, 5000);
                        continue;
                    }
                }

                // Non-retryable error or max retries reached
                if (!errorInfo.retryable || attempt >= maxRetries - 1) {
                    return { text: "", error: formatErrorMessage(errorInfo) };
                }

                // Wait before retry for other errors
                await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
            }
        }

        const errorInfo = categorizeError(lastError, 'Groq', this.model);
        return { text: "", error: formatErrorMessage(errorInfo) };
    }
}

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;
    private model: string;
    private static lastRequestTime: number = 0;
    private static minRequestInterval: number = 500; // 500ms between requests

    constructor(apiKey: string, model: string = 'gemini-flash-latest') {
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Gemini API key is required');
        }
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.normalizeModelName(model);
    }

    private async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - GeminiProvider.lastRequestTime;
        if (timeSinceLastRequest < GeminiProvider.minRequestInterval) {
            const waitTime = GeminiProvider.minRequestInterval - timeSinceLastRequest;
            console.log(`[Gemini] Rate limit protection: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        GeminiProvider.lastRequestTime = Date.now();
    }

    private normalizeModelName(model: string): string {
        // Map common model name variations to valid Gemini model names
        const modelMap: Record<string, string> = {
            // Map generic names to latest available versions
            'gemini-pro': 'gemini-pro-latest',
            'gemini-flash': 'gemini-flash-latest',

            // Map 1.5 legacy requests to available Latest models
            'gemini-1.5-pro': 'gemini-pro-latest',
            'gemini-1.5-flash': 'gemini-flash-latest',
            'gemini-1.5-pro-latest': 'gemini-pro-latest',
            'gemini-1.5-flash-latest': 'gemini-flash-latest',
            'gemini-1.5-pro-002': 'gemini-pro-latest',
            'gemini-1.5-flash-002': 'gemini-flash-latest',

            // Direct mappings for newer models
            'gemini-2.0-flash': 'gemini-2.0-flash',
            'gemini-2.0-flash-exp': 'gemini-2.0-flash',
            'gemini-2.5-flash': 'gemini-2.5-flash',
            'gemini-2.5-pro': 'gemini-2.5-pro',
        };
        return modelMap[model] || model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        // Wait for rate limit
        await this.waitForRateLimit();

        // List of models to try in order of preference
        const modelsToTry = [
            'gemini-flash-latest',       // Most reliable (verified working)
            this.model,                  // The requested model (if different)
            'gemini-2.0-flash',          // Newer flash model
            'gemini-pro-latest'          // Pro fallback
        ];

        // Deduplicate
        const uniqueModels = [...new Set(modelsToTry)];
        let lastError: any = null;
        let attemptCount = 0;

        for (const modelName of uniqueModels) {
            attemptCount++;
            try {
                console.log(`[Gemini] Attempting generation with model: ${modelName} (attempt ${attemptCount}/${uniqueModels.length})`);

                const generationConfig: Record<string, any> = {};

                if (request.json) {
                    generationConfig.responseMimeType = "application/json";
                }

                const model = this.client.getGenerativeModel(
                    {
                        model: modelName,
                        generationConfig
                    },
                    { apiVersion: 'v1beta' }
                );

                let fullPrompt = request.prompt;
                if (request.system) {
                    fullPrompt = `Instructions: ${request.system}\n\nUser Request: ${request.prompt}`;
                }

                // Add timeout to the generation
                const generatePromise = model.generateContent(fullPrompt);
                const result = await withTimeout(generatePromise, DEFAULT_TIMEOUT_MS, 'Gemini');

                if (!result || !result.response) {
                    throw new Error("No response received from Gemini API");
                }

                const response = result.response;

                // Check for blocked content
                if (response.promptFeedback?.blockReason) {
                    const reason = response.promptFeedback.blockReason;
                    throw new Error(`Content blocked by Gemini: ${reason}`);
                }

                if (!response.candidates || response.candidates.length === 0) {
                    throw new Error("Gemini returned no response candidates");
                }

                const text = response.text();

                if (!text || text.trim() === '') {
                    throw new Error("Gemini returned an empty response");
                }

                const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
                recordGeneration('gemini', tokensUsed);

                console.log(`[Gemini] Successfully generated ${text.length} characters with ${modelName}`);

                if (modelName !== this.model) {
                    console.warn(`[Gemini] Auto-switched from '${this.model}' to '${modelName}'`);
                }

                return { text, modelUsed: modelName };

            } catch (e: any) {
                console.warn(`[Gemini] Failed with model ${modelName}:`, e.message);
                lastError = e;
                const errorInfo = categorizeError(e, 'Gemini', modelName);

                // Stop trying if it's a non-retryable error
                if (!errorInfo.retryable ||
                    errorInfo.code === LLMErrorCode.INVALID_KEY ||
                    errorInfo.code === LLMErrorCode.CONTENT_BLOCKED) {
                    break;
                }

                // Continue to next model for retryable errors
            }
        }

        console.error("[Gemini] All model attempts failed. Last error:", lastError);
        const errorInfo = categorizeError(lastError, 'Gemini', this.model);

        // Provide a helpful message based on the error type
        let errorMessage: string;
        if (errorInfo.code === LLMErrorCode.INVALID_KEY) {
            errorMessage = "Invalid Gemini API key. Please check your API key in Settings.";
        } else if (errorInfo.code === LLMErrorCode.QUOTA_EXCEEDED || errorInfo.code === LLMErrorCode.RATE_LIMIT) {
            errorMessage = "Gemini API quota/rate limit exceeded for all available models. Please try a different provider (Groq or OpenAI), or wait a few minutes and try again.";
        } else if (errorInfo.code === LLMErrorCode.CONTENT_BLOCKED) {
            errorMessage = "Content was blocked by Gemini's safety filters. Please try rephrasing your request.";
        } else if (errorInfo.code === LLMErrorCode.TIMEOUT) {
            errorMessage = "Gemini API is not responding. Please try again or switch to a different provider.";
        } else {
            errorMessage = `Gemini failed after trying ${attemptCount} models. ${errorInfo.message}`;
        }

        return { text: "", error: errorMessage };
    }
}

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('OpenAI API key is required');
        }
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        try {
            console.log(`[OpenAI] Generating with model: ${this.model}`);

            const completionPromise = this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: request.system || 'You are a helpful assistant.' },
                    { role: 'user', content: request.prompt }
                ],
                model: this.model,
                response_format: request.json ? { type: 'json_object' } : undefined
            });

            const completion = await withTimeout(completionPromise, DEFAULT_TIMEOUT_MS, 'OpenAI');

            const text = completion.choices[0]?.message?.content || "";

            if (!text || text.trim() === '') {
                return { text: "", error: "OpenAI returned an empty response. Please try again." };
            }

            const tokensUsed = completion.usage?.total_tokens || 0;
            recordGeneration('openai', tokensUsed);

            console.log(`[OpenAI] Successfully generated ${text.length} characters`);
            return { text };

        } catch (e: unknown) {
            console.error("[OpenAI] Error:", e);
            const errorInfo = categorizeError(e, 'OpenAI', this.model);
            return { text: "", error: formatErrorMessage(errorInfo) };
        }
    }
}

export class ProviderFactory {
    static getProvider(provider: 'groq' | 'gemini' | 'openai', apiKey: string, model?: string): LLMProvider {
        // Validate API key before creating provider
        if (!apiKey || apiKey.trim() === '') {
            throw new Error(`Missing API key for ${provider}. Please configure your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key in Settings.`);
        }

        switch (provider) {
            case 'groq':
                return new GroqProvider(apiKey, model);
            case 'gemini':
                return new GeminiProvider(apiKey, model);
            case 'openai':
                return new OpenAIProvider(apiKey, model);
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    // Validate an API key by attempting a minimal generation
    static async validateApiKey(provider: 'groq' | 'gemini' | 'openai', apiKey: string): Promise<{ valid: boolean; error?: string }> {
        try {
            const llmProvider = this.getProvider(provider, apiKey);
            const response = await llmProvider.generate({
                prompt: 'Reply with just "ok"',
                json: false
            });

            if (response.error) {
                return { valid: false, error: response.error };
            }

            return { valid: true };
        } catch (e: any) {
            return { valid: false, error: e.message || 'Failed to validate API key' };
        }
    }
}

// Export error types for use elsewhere
export type { LLMErrorInfo as ErrorInfo };
