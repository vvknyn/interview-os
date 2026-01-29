"use server";

import { ProviderFactory } from "@/lib/llm/providers";
import { ProviderConfig } from "@/lib/llm/types";
import { fetchProfile } from "@/actions/profile";

const processEnv = process.env;

// Helper to get configuration (same approach as generate-context.ts)
const getConfig = async (override?: Partial<ProviderConfig>) => {
    try {
        // 1. Check Override first (for guest users)
        if (override?.apiKey && override?.provider) {
            return {
                apiKey: override.apiKey,
                provider: override.provider,
                model: override.model || (override.provider === 'gemini' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile')
            };
        }

        const { data } = await fetchProfile();

        // Parse preferred_model for provider:model format
        const rawModel = override?.model || data?.preferred_model || "groq:llama-3.3-70b-versatile";
        let provider: 'groq' | 'gemini' | 'openai' = 'groq';
        let model = rawModel;

        if (rawModel.includes(':')) {
            const parts = rawModel.split(':');
            provider = parts[0] as any;
            model = parts.slice(1).join(':');
        } else {
            provider = 'groq';
            model = rawModel || "llama-3.3-70b-versatile";
        }

        // Handle API Key
        let apiKey = "";

        // 1. Try JSON stored in DB custom_api_key
        if (data?.custom_api_key?.trim().startsWith('{')) {
            try {
                const keys = JSON.parse(data.custom_api_key);
                apiKey = keys[provider];
            } catch (e) {
                console.warn("Failed to parse API keys JSON", e);
            }
        }

        // 2. Legacy fallback
        if (!apiKey && data?.custom_api_key && !data.custom_api_key.trim().startsWith('{')) {
            if (provider === 'groq') apiKey = data.custom_api_key;
        }

        // 3. Environment fallback
        if (!apiKey) {
            if (provider === 'groq') apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY || "";
            if (provider === 'gemini') apiKey = processEnv.GEMINI_API_KEY || processEnv.NEXT_PUBLIC_GEMINI_API_KEY || "";
            if (provider === 'openai') apiKey = processEnv.OPENAI_API_KEY || processEnv.NEXT_PUBLIC_OPENAI_API_KEY || "";
        }

        if (!apiKey) throw new Error(`Missing API Key for ${provider}. Please configure it in Settings.`);

        return { apiKey, provider, model };
    } catch (e: unknown) {
        const apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY;
        if (!apiKey) throw new Error("Critical: No API Key available. " + (e instanceof Error ? e.message : ""));
        return { apiKey, provider: 'groq' as const, model: "llama-3.3-70b-versatile" };
    }
};

// Generate professional summary
export async function generateSummary(params: {
    role: string;
    yearsExperience: number;
    keySkills: string[];
    configOverride?: Partial<ProviderConfig>;
}): Promise<{ summary?: string; error?: string }> {
    try {
        const config = await getConfig(params.configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const prompt = `
            Generate a professional resume summary for:
            - Role: ${params.role}
            - Years of Experience: ${params.yearsExperience}
            - Key Skills: ${params.keySkills.join(', ')}
            
            Requirements:
            - 2-3 sentences maximum
            - Professional and concise
            - Highlight relevant experience and skills
            - Use active voice and strong action words
            - Focus on value and accomplishments
            
            Return ONLY the summary text, no additional formatting or labels.
        `;

        const response = await provider.generate({ prompt });

        if (response.error) {
            return { error: response.error };
        }

        return { summary: response.text?.trim() || "" };
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Generate Summary Error:", error);
        return { error: error.message || "Failed to generate summary" };
    }
}

// Generate experience bullet points
export async function generateExperienceBullets(params: {
    role: string;
    company: string;
    description: string;
    configOverride?: Partial<ProviderConfig>;
}): Promise<{ bullets?: string[]; error?: string }> {
    try {
        const config = await getConfig(params.configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const prompt = `
            Convert this job description into professional resume bullet points:
            
            Role: ${params.role}
            Company: ${params.company}
            Description: ${params.description}
            
            Requirements:
            - Generate 3-5 bullet points
            - Start each with a strong action verb (Led, Developed, Implemented, Drove, etc.)
            - Include quantifiable results where possible (use realistic metrics based on the description)
            - Focus on impact and achievements, not just responsibilities
            - Keep each bullet to 1-2 lines maximum
            - Use past tense for completed roles
            
            Return as a JSON array of strings:
            { "bullets": ["Bullet point 1", "Bullet point 2", ...] }
        `;

        const response = await provider.generate({
            prompt,
            json: true,
            system: "You are an expert resume writer. Return ONLY valid JSON."
        });

        if (response.error) {
            return { error: response.error };
        }

        try {
            const parsed = JSON.parse(response.text || "{}");
            return { bullets: parsed.bullets || [] };
        } catch (parseError) {
            // Fallback: try to extract bullets from plain text
            const lines = response.text?.split('\n').filter(line => line.trim().length > 0) || [];
            return { bullets: lines.slice(0, 5) };
        }
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Generate Experience Bullets Error:", error);
        return { error: error.message || "Failed to generate bullet points" };
    }
}

// Improve existing text with AI
export async function improveResumeText(params: {
    text: string;
    section: 'summary' | 'experience' | 'skills';
    configOverride?: Partial<ProviderConfig>;
}): Promise<{ improved?: string; error?: string }> {
    try {
        const config = await getConfig(params.configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const prompt = `
            Improve this resume ${params.section} section to be more professional and impactful:
            
            Original text:
            ${params.text}
            
            Requirements:
            - Make it more concise and impactful
            - Use stronger action words
            - Remove any informal language
            - Maintain the same core information
            - ${params.section === 'experience' ? 'Use bullet points with quantifiable results' : ''}
            - ${params.section === 'summary' ? 'Keep to 2-3 sentences' : ''}
            
            Return ONLY the improved text, no additional formatting or explanations.
        `;

        const response = await provider.generate({ prompt });

        if (response.error) {
            return { error: response.error };
        }

        return { improved: response.text?.trim() || "" };
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Improve Resume Text Error:", error);
        return { error: error.message || "Failed to improve text" };
    }
}
