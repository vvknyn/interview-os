
import { LLMProvider, LLMRequest, LLMResponse } from './types';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export class GroqProvider implements LLMProvider {
    private client: Groq;
    private model: string;

    constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
        this.client = new Groq({ apiKey });
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: request.system || 'You are a helpful assistant.' },
                    { role: 'user', content: request.prompt }
                ],
                model: this.model,
                response_format: request.json ? { type: 'json_object' } : undefined
            });

            const text = completion.choices[0]?.message?.content || "";
            return { text };
        } catch (e: unknown) {
            console.error("Groq Error:", e);
            const msg = e instanceof Error ? e.message : "Groq generation failed";
            return { text: "", error: msg };
        }
    }
}

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-1.5-flash-latest') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.model,
                generationConfig: {
                    responseMimeType: request.json ? "application/json" : "text/plain"
                }
            });

            const prompt = (request.system ? `System: ${request.system}\n\n` : "") + request.prompt;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return { text };
        } catch (e: unknown) {
            console.error("Gemini Error:", e);
            const msg = e instanceof Error ? e.message : "Gemini generation failed";
            return { text: "", error: msg };
        }
    }
}

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    { role: 'system', content: request.system || 'You are a helpful assistant.' },
                    { role: 'user', content: request.prompt }
                ],
                model: this.model,
                response_format: request.json ? { type: 'json_object' } : undefined
            });

            const text = completion.choices[0]?.message?.content || "";
            return { text };
        } catch (e: unknown) {
            console.error("OpenAI Error:", e);
            const msg = e instanceof Error ? e.message : "OpenAI generation failed";
            return { text: "", error: msg };
        }
    }
}

export class ProviderFactory {
    static getProvider(provider: 'groq' | 'gemini' | 'openai', apiKey: string, model?: string): LLMProvider {
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
}
