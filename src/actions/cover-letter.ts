"use server";

import { ProviderFactory } from "@/lib/llm/providers";
import { fetchProfile, loadProviderApiKeys } from "@/actions/profile";
import { fetchUrlContent } from "@/actions/fetch-url";

export async function generateCoverLetter(resumeContent: string, jobUrlOrDescription: string) {
    try {
        // 1. Fetch Job Content if it's a URL
        let jobContext = jobUrlOrDescription;
        if (jobUrlOrDescription.startsWith('http')) {
            const { data, error } = await fetchUrlContent(jobUrlOrDescription);
            if (error) {
                console.warn("Could not fetch job URL, using string as is:", error);
            } else if (data) {
                jobContext = data;
            }
        }

        // 2. Get API Config
        const { data: profile } = await fetchProfile();
        const { data: apiKeys } = await loadProviderApiKeys();

        let providerName: 'groq' | 'gemini' | 'openai' = 'groq';
        let apiKey = "";
        let model = "llama-3.3-70b-versatile";

        if (profile?.preferred_model) {
            if (profile.preferred_model.includes(':')) {
                const parts = profile.preferred_model.split(':');
                providerName = parts[0] as any;
                model = parts.slice(1).join(':');
            } else {
                if (profile.preferred_model.startsWith('gpt')) providerName = 'openai';
                else if (profile.preferred_model.startsWith('gemini')) providerName = 'gemini';
                else providerName = 'groq';
                model = profile.preferred_model;
            }
        }

        // Resolve API Key: User's custom key -> Env var -> Fallback
        if (providerName === 'groq') {
            apiKey = apiKeys?.groq || process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
        } else if (providerName === 'gemini') {
            apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
        } else if (providerName === 'openai') {
            apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
        }

        // Fallback: If selected provider has no key, try to find ANY provider with a key
        if (!apiKey) {
            console.warn(`No API key found for preferred provider ${providerName}. Checking others...`);
            if (apiKeys?.groq || process.env.GROQ_API_KEY) {
                providerName = 'groq';
                apiKey = apiKeys?.groq || process.env.GROQ_API_KEY || "";
                model = "llama-3.3-70b-versatile";
            } else if (apiKeys?.gemini || process.env.GEMINI_API_KEY) {
                providerName = 'gemini';
                apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY || "";
                model = "gemini-1.5-pro";
            } else if (apiKeys?.openai || process.env.OPENAI_API_KEY) {
                providerName = 'openai';
                apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY || "";
                model = "gpt-4o";
            }
        }

        if (!apiKey) {
            return { error: "No API Key available. Please check settings." };
        }

        const provider = ProviderFactory.getProvider(providerName, apiKey, model);

        // 3. Generate Cover Letter
        const prompt = `
            You are an expert career coach and professional writer.
            
            TASK: Write a customized, compelling cover letter for the following candidate and job.
            
            CANDIDATE RESUME:
            ${resumeContent.substring(0, 15000)}
            
            JOB DESCRIPTION:
            ${jobContext.substring(0, 10000)}
            
            GUIDELINES:
            1. **Tone**: Extremely human, conversational, and authentic. Avoid "AI-sounding" phrases like "I am writing to express my enthusiastic interest" or "seamlessly align". Instead, write like a real person speaking to another person. Be confident but humble.
            2. **Structure**: 
               - Hook the reader immediately with a genuine connection to the company or mission.
               - Middle paragraph: Tell 1-2 short, specific stories from the resume that prove ability to do *this* job. Don't just list skills.
               - Closing: Brief, professional, and call to action.
            3. **Formatting**: Standard business letter format. Start directly with "Date" and "Dear Hiring Team" (or specific name if found).
            4. **Length**: Strict limit of approximately 200 words. Keep it punchy and respectful of the recruiter's time.
            
            Output ONLY the cover letter text.
        `;

        const response = await provider.generate({
            system: "You are a professional resume writer who writes in a very human, non-robotic tone. You prioritize brevity and impact.",
            prompt: prompt
        });

        if (response.error) {
            return { error: response.error };
        }

        return { data: response.text };

    } catch (e: any) {
        console.error("Cover Letter Generation Error:", e);
        return { error: e.message || "Failed to generate cover letter" };
    }
}
