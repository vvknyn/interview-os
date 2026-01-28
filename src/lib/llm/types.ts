
export interface LLMRequest {
    system?: string;
    prompt: string;
    json?: boolean;
}

export interface LLMResponse {
    text: string;
    error?: string;
}

export interface LLMProvider {
    generate(request: LLMRequest): Promise<LLMResponse>;
}

export interface ProviderConfig {
    provider: 'groq' | 'gemini' | 'openai';
    apiKey: string;
    model: string;
}
