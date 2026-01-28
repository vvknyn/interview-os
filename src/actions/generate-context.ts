"use server";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, TechnicalData, CodingChallenge } from "@/types";
import { fetchProfile } from "@/actions/profile";
import { ProviderFactory } from "@/lib/llm/providers";

const processEnv = process.env;

// Helper to get configuration (Custom or Default)
const getConfig = async () => {
    try {
        const { data } = await fetchProfile();

        // Parse preferred_model for provider:model format
        // Default: groq:llama-3.3-70b-versatile
        let rawModel = data?.preferred_model || "groq:llama-3.3-70b-versatile";
        let provider: 'groq' | 'gemini' | 'openai' = 'groq';
        let model = rawModel;

        if (rawModel.includes(':')) {
            const parts = rawModel.split(':');
            provider = parts[0] as any;
            model = parts.slice(1).join(':');
        } else {
            // Legacy fallback
            provider = 'groq';
            model = rawModel || "llama-3.3-70b-versatile";
        }

        // Handle API Key (Header > DB > Env)
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

        // 2. If not found or not JSON, check if it's a raw key for the current default provider (legacy behavior)
        if (!apiKey && data?.custom_api_key && !data.custom_api_key.trim().startsWith('{')) {
            // Assume legacy key is for Groq if provider is Groq
            if (provider === 'groq') apiKey = data.custom_api_key;
        }

        // 3. Fallback to Environment Variables
        if (!apiKey) {
            if (provider === 'groq') apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY || "";
            if (provider === 'gemini') apiKey = processEnv.GEMINI_API_KEY || processEnv.NEXT_PUBLIC_GEMINI_API_KEY || "";
            if (provider === 'openai') apiKey = processEnv.OPENAI_API_KEY || processEnv.NEXT_PUBLIC_OPENAI_API_KEY || "";
        }

        if (!apiKey) throw new Error(`Missing API Key for ${provider}. Please set it in Settings.`);

        return { apiKey, provider, model };
    } catch (e: any) {
        // Fallback safety
        const apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY;
        if (!apiKey) throw new Error("Critical: No API Key available.");
        return { apiKey, provider: 'groq' as const, model: "llama-3.3-70b-versatile" };
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatError = (e: any) => {
    console.error("Generation Error:", e);
    let errorMessage = "An unexpected error occurred.";
    if (e.message) {
        if (e.message.includes("429") || e.message.includes("rate limit")) {
            errorMessage = "🚨 API Rate Limit Exceeded. Please try again later or switch models.";
        } else if (e.message.includes("401") || e.message.includes("unauthorized")) {
            errorMessage = "🚫 Unauthorized. Please check your API Key in Settings.";
        } else {
            errorMessage = `Provider Error: ${e.message}`;
        }
    } else {
        errorMessage = JSON.stringify(e);
    }
    return { error: errorMessage };
};

// Regex to extract JSON from markdown or noisy output
const JSON_REPAIR_REGEX = /\{(?:[^{}]|\{(?:[^{}]|{[^{}]*})*\})*\}/;

const repairJSON = (text: string) => {
    try {
        // First try standard parse
        return JSON.parse(text);
    } catch {
        // Attempt 1: Strip Markdown Code Blocks
        let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            return JSON.parse(cleanText);
        } catch {
            // Attempt 2: Extract JSON object syntax using Regex
            const match = text.match(JSON_REPAIR_REGEX);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch {
                    return null;
                }
            }
            return null;
        }
    }
};

const fetchJSON = async (prompt: string, label: string) => {
    // Fallback logic could be complex with multi-provider. 
    // For now, let's keep it simple: reliable providers usually don't need complex model fallbacks 
    // IF the user supplies a valid key. 
    // We will implement simple retry for the *same* provider/model first.

    const attemptFetch = async (retryCount: number = 0): Promise<any> => {
        try {
            const config = await getConfig();
            const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

            console.log(`[DEBUG] Fetching ${label} with ${config.provider}:${config.model}...`);

            // Safety delay
            await delay(500 + (retryCount * 1000));

            const response = await provider.generate({
                system: "You are an expert technical interviewer and career coach. Return ONLY valid JSON.",
                prompt: prompt + "\n\nCRITICAL: Return ONLY valid JSON. No markdown formatting.",
                json: true
            });

            if (response.error) throw new Error(response.error);

            let parsed = repairJSON(response.text || "{}");

            if (!parsed) {
                console.warn(`[DEBUG] JSON parse failed for ${label}, retrying correction...`);
                await delay(1000);
                const retryResponse = await provider.generate({
                    system: "You output invalid JSON last time. Output purely raw JSON key-value pairs.",
                    prompt: prompt,
                    json: true
                });
                parsed = repairJSON(retryResponse.text || "{}");
            }

            if (!parsed) throw new Error("Failed to parse JSON response.");
            return parsed;

        } catch (e: any) {
            // Basic retry for transient errors
            if (retryCount < 2) {
                console.warn(`[DEBUG] Error fetching ${label}, retrying (${retryCount + 1}/2)...`, e.message);
                return attemptFetch(retryCount + 1);
            }
            throw e;
        }
    };

    return attemptFetch();
};



// ... [rest of file until imports end]

export async function fetchRecon(company: string, position: string): Promise<{ data?: CompanyReconData; error?: string }> {
    try {
        const prompt = `
            Analyze company '${company}' for a candidate applying to the '${position}' role. 
            Provide a comprehensive executive summary based on REAL data.
            
            STRATEGY:
            1. IDENTIFY: specific tech companies, startups, or unicorns that match '${company}'.
               - Example: "League" -> Likely "League Inc" (HealthOS/Fintech benefit platform).
               - Example: "Rippling" -> HR Tech.
            2. VERIFY: If the company is real, provide specific details (Business Model, Competitors).
            3. FALLBACK: Only if absolutely unknown, provide "General Industry" advice based on the name.
            
            CRITICAL INSTRUCTION: 
            - DO NOT hallucinate details if the company is completely unknown. 
            - DO NOT default to FAANG (Google/Amazon) unless the user asks for them.
            - Prioritize matching to known Tech/Health/Finance startups over generic dictionary words.
            
            Return JSON in this EXACT format:
            { 
               "name": "${company}", 
               "ticker": "Stock Ticker or Private (or 'Unknown')", 
               "industry": "Industry Name (or 'Technology')", 
               "description": "200-word executive summary. Focus on the SPECIFIC company if known. Mention their main product/mission.", 
               "vibe": "3 words describing culture (e.g. 'Fast-paced', 'Innovative', ' Collaborative')", 
               "business_model": "How they make money (short summary)", 
               "competitors": ["Competitor1", "Competitor2", "Competitor3"] 
            }
        `;
        const data = await fetchJSON(prompt, "Recon");
        return { data: data as CompanyReconData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchMatch(company: string, position: string, round: string, resume: string, stories: string, sources: string = ""): Promise<{ data?: MatchData; error?: string }> {
    try {
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}\n\nADDITIONAL SOURCES:\n${sources}`;
        const prompt = `
            Context: Interview at ${company} for the role of '${position}' (Round: ${round}).
            Candidate Context: ${fullContext}
            
            Task: 
            1. Select the top 2-3 matched experiences from the resume that best align with the '${position}' role. 
            2. If the candidate's past titles (e.g. "Product Manager") differ from the target role ("${position}"), you MUST explicitly frame the experience to highlight TRANSFERABLE SKILLS relevant to '${position}'.
            3. Do NOT just copy-paste the resume. ADAPT the narrative.
            4. Write a VERBATIM first-person "Tell me about yourself" script (Reasoning) tailored specifically for this '${position}' interview.
            
            Return JSON: 
            { 
              "matched_entities": ["String 1", "String 2"], // MUST be an Array of STRINGS. Do NOT return objects.
              "headline": "A [Target Role]-focused headline", 
              "reasoning": "I have a background in [X], which gives me a unique perspective on [Target Role]..." 
            }
        `;
        const data = await fetchJSON(prompt, "Match");
        return { data: data as MatchData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchQuestions(company: string, position: string, round: string): Promise<{ data?: QuestionsData; error?: string }> {
    try {
        const prompt = `
            Generate 20 interview questions for the role of ${position} at ${company} (Round: ${round}).
            
            Categorize them exactly as follows:
            - **Behavioral**: Cultural fit, soft skills, past experiences (STAR method relevant).
            - **Knowledge**: Technical concepts, definitions, system design, or industry knowledge (Direct answers).
            - **Coding**: Algorithmic or practical coding challenges (if applicable to role).
            - **Case Study**: Hypothetical business or technical scenarios.
            
            Return JSON: 
            { 
              "questions": [
                { "id": "1", "category": "Behavioral", "question": "Tell me about a time you..." },
                { "id": "2", "category": "Knowledge", "question": "What is the difference between..." },
                ...
              ] 
            }
        `;
        const data = await fetchJSON(prompt, "Questions");
        return { data: data as QuestionsData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchReverse(company: string, position: string, round: string, resume: string, stories: string, sources: string = ""): Promise<{ data?: ReverseQuestionsData; error?: string }> {
    try {
        const prompt = `
            Generate 5 strategic questions for the candidate to ask the interviewer at ${company} (${position}, ${round}).
            Focus on deep insights, not surface level.
            
            Return JSON: { "reverse_questions": ["Question 1", ...] }
        `;
        const data = await fetchJSON(prompt, "Reverse");
        return { data: data as ReverseQuestionsData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchTechnicalQuestions(company: string, position: string, round: string, sources: string = ""): Promise<{ data?: TechnicalData; error?: string }> {
    try {
        const prompt = `
            Context: ${company}, ${position}, ${round}. Sources: ${sources}
            Generate 5 conceptual technical questions (not coding).
            
            Return JSON: 
            { 
                "questions": [
                    { "topic": "Topic", "question": "Question text", "context_clue": "Hint" }
                ] 
            }
        `;
        const data = await fetchJSON(prompt, "Technical");
        return { data: data as TechnicalData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function explainTechnicalConcept(concept: string): Promise<string> {
    try {
        const prompt = `Explain this technical concept briefly for an interview context: "${concept}"`;
        return await generateGenericText(prompt);
    } catch (e: any) {
        console.error("Explanation Error:", e);
        return "Failed to generate explanation.";
    }
}

export async function fetchCodingChallenge(company: string, position: string, round: string): Promise<{ data?: CodingChallenge; error?: string }> {
    try {
        const prompt = `
            Generate a coding problem for ${company} ${position}.
            Return JSON:
            {
                "title": "Title",
                "description": "Markdown description",
                "examples": ["In: 1, Out: 2"],
                "constraints": ["O(n) time"],
                "starter_code": "function solution() {}",
                "solution_approach": "Hint"
            }
        `;
        const data = await fetchJSON(prompt, "Coding");
        return { data: data as CodingChallenge };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function generateCodeFeedback(code: string, problem: string): Promise<string> {
    try {
        const prompt = `
            Analyze this code solution for: ${problem}
            Code: ${code}
            Provide feedback on correctness, complexity, and style.
        `;
        return await generateGenericText(prompt);
    } catch (e: any) {
        console.error("Code Feedback Error:", e);
        return "Failed to generate feedback.";
    }
}

export async function generateGenericJSON(prompt: string): Promise<any> {
    try {
        return await fetchJSON(prompt, "Generic JSON");
    } catch (e: any) {
        console.error("Generic JSON Error:", e);
        return null;
    }
}

export async function generateGenericText(prompt: string): Promise<string> {
    try {
        const config = await getConfig();
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const response = await provider.generate({
            prompt: prompt
        });

        if (response.error) throw new Error(response.error);
        return response.text || "Error generating text.";
    } catch (e: any) {
        console.error("Generic Text Error:", e);
        return "Error generating text.";
    }
}
