"use server";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, TechnicalData, CodingChallenge, AnswerCritique, QuestionItem, SystemDesignData } from "@/types";
import { fetchServerCache, saveServerCache } from "@/actions/cache";
import { fetchProfile } from "@/actions/profile";
import { ProviderFactory } from "@/lib/llm/providers";

const processEnv = process.env;

import { ProviderConfig } from "@/lib/llm/types";

// Helper to get configuration (Custom or Default)
const getConfig = async (override?: Partial<ProviderConfig>) => {
    try {
        const { data } = await fetchProfile();

        // 1. Determine Provider and Model
        // Priority: Override -> DB Preferred -> Default
        let provider: 'groq' | 'gemini' | 'openai' = 'groq';
        let model = "llama-3.3-70b-versatile";

        if (override?.provider) {
            provider = override.provider;
            model = override.model || (provider === 'gemini' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile');
        } else if (data?.preferred_model) {
            const rawModel = data.preferred_model;
            if (rawModel.includes(':')) {
                const parts = rawModel.split(':');
                provider = parts[0] as any;
                model = parts.slice(1).join(':');
            } else {
                provider = 'groq'; // Legacy default
                model = rawModel;
            }
        }

        // Apply Model Override if specified (and provider wasn't explicitly changed to something else)
        if (override?.model) {
            model = override.model;
        }

        // Auto-fix deprecated Gemini models
        if (provider === 'gemini') {
            if (model === 'gemini-1.5-pro' || model === 'gemini-1.5-pro-latest' || model === 'gemini-1.5-pro-002') model = 'gemini-pro-latest';
            if (model === 'gemini-1.5-flash' || model === 'gemini-1.5-flash-latest' || model === 'gemini-1.5-flash-002') model = 'gemini-flash-latest';
            if (model === 'gemini-pro') model = 'gemini-pro-latest';
            if (model === 'gemini-flash') model = 'gemini-flash-latest';
        }

        // 2. Determine API Key
        let apiKey = "";

        // A. Override Key
        if (override?.apiKey && override.apiKey.trim() !== "") {
            apiKey = override.apiKey;
        }

        // B. DB Keys (JSON)
        if (!apiKey && data?.custom_api_key?.trim().startsWith('{')) {
            try {
                const keys = JSON.parse(data.custom_api_key);
                if (keys[provider]) apiKey = keys[provider];
            } catch (e) {
                console.warn("Failed to parse API keys JSON", e);
            }
        }

        // C. Legacy DB Key (Text)
        if (!apiKey && data?.custom_api_key && !data.custom_api_key.trim().startsWith('{')) {
            if (provider === 'groq') apiKey = data.custom_api_key;
        }

        // D. Environment Variables
        if (!apiKey) {
            if (provider === 'groq') apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY || "";
            if (!apiKey && provider === 'gemini') apiKey = processEnv.GEMINI_API_KEY || processEnv.NEXT_PUBLIC_GEMINI_API_KEY || "";
            if (!apiKey && provider === 'openai') apiKey = processEnv.OPENAI_API_KEY || processEnv.NEXT_PUBLIC_OPENAI_API_KEY || "";
        }

        if (!apiKey) {
            const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
            throw new Error(`Missing API key for ${providerName}. Please click the model switcher to configure your API key.`);
        }

        return { apiKey, provider, model };
    } catch (e: unknown) {
        // Fallback safety - try environment variables
        const fallbackKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY || "";
        if (fallbackKey) {
            console.warn("[Config] Using fallback Groq API key from environment:", e instanceof Error ? e.message : String(e));
            return { apiKey: fallbackKey, provider: 'groq' as const, model: "llama-3.3-70b-versatile" };
        }
        const errorMsg = e instanceof Error ? e.message : "No API key configured";
        throw new Error(errorMsg);
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatError = (e: any) => {
    console.error("Generation Error:", e);
    const msg = e?.message || String(e) || "";
    const lowerMsg = msg.toLowerCase();

    let errorMessage = "An unexpected error occurred.";

    // Check for specific error patterns
    if (lowerMsg.includes("timeout") || lowerMsg.includes("timed out")) {
        errorMessage = "Request timed out. The AI service may be slow. Please try again or switch to a different provider.";
    } else if (lowerMsg.includes("429") || lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again, or switch to a different AI provider.";
    } else if (lowerMsg.includes("401") || lowerMsg.includes("unauthorized") || lowerMsg.includes("invalid") && lowerMsg.includes("key")) {
        errorMessage = "Invalid API key. Please check your API key in the model switcher settings.";
    } else if (lowerMsg.includes("quota") || lowerMsg.includes("resource_exhausted")) {
        errorMessage = "API quota exceeded. Please try a different AI provider (use the model switcher) or wait for your quota to reset.";
    } else if (lowerMsg.includes("missing api key") || lowerMsg.includes("api key is required")) {
        errorMessage = "No API key configured. Please click the model switcher to add your API key.";
    } else if (lowerMsg.includes("content") && (lowerMsg.includes("blocked") || lowerMsg.includes("safety"))) {
        errorMessage = "Content was blocked by the AI's safety filters. Please try a different query.";
    } else if (lowerMsg.includes("network") || lowerMsg.includes("econnrefused") || lowerMsg.includes("fetch failed")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
    } else if (lowerMsg.includes("not found") || lowerMsg.includes("model_not_found") || lowerMsg.includes("does not exist")) {
        errorMessage = "The selected model is not available. Please try a different model in the model switcher.";
    } else if (msg && msg.length > 0) {
        // Clean up the error message for display
        errorMessage = msg.replace(/^\[?\w+\]?\s*:?\s*/i, ''); // Remove provider prefixes like "[Groq]"
        // Truncate long error messages
        if (errorMessage.length > 200) {
            errorMessage = errorMessage.substring(0, 200) + "...";
        }
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
        const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
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

const fetchJSON = async (prompt: string, label: string, configOverride?: Partial<ProviderConfig>) => {
    // Helper for timeout
    const withTimeout = (promise: Promise<any>, ms: number, label: string) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`[Timeout] ${label} timed out after ${ms}ms`)), ms))
        ]);
    };

    const attemptFetch = async (retryCount: number = 0): Promise<any> => {
        try {
            const config = await getConfig(configOverride);
            const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

            console.log(`[DEBUG] Fetching ${label} with ${config.provider}:${config.model}...`);

            // 60s Global Timeout for Generation (provider handles its own rate limiting)
            const response = await withTimeout(
                provider.generate({
                    system: "You are an expert technical interviewer and career coach. Return ONLY valid JSON.",
                    prompt: prompt + "\n\nCRITICAL: Return ONLY valid JSON. No markdown formatting.",
                    json: true
                }),
                60000,
                label
            );

            if (response.error) {
                // Check if it's a daily limit error - don't retry
                if (response.error.includes('daily') || response.error.includes('TPD') || response.error.includes('tomorrow')) {
                    throw new Error(response.error);
                }
                throw new Error(response.error);
            }

            let parsed = repairJSON(response.text || "{}");

            if (!parsed) {
                console.warn(`[DEBUG] JSON parse failed for ${label}, attempting repair...`);
                // Try to extract JSON from the response without making another API call
                const jsonMatch = (response.text || "").match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        parsed = JSON.parse(jsonMatch[0]);
                    } catch {
                        // Fall through to retry
                    }
                }

                if (!parsed && retryCount < 1) {
                    // Only retry once for JSON parse failure
                    await delay(1000);
                    const retryResponse = await withTimeout(
                        provider.generate({
                            system: "You output invalid JSON last time. Output purely raw JSON key-value pairs.",
                            prompt: prompt,
                            json: true
                        }),
                        30000,
                        `${label} (Correction)`
                    );
                    parsed = repairJSON(retryResponse.text || "{}");
                }
            }

            if (!parsed) throw new Error("Failed to parse JSON response.");
            return parsed;

        } catch (e: any) {
            // Don't retry for daily limits or auth errors
            const errorMsg = e.message?.toLowerCase() || '';
            if (errorMsg.includes('daily') || errorMsg.includes('tpd') ||
                errorMsg.includes('tomorrow') || errorMsg.includes('unauthorized') ||
                errorMsg.includes('invalid') && errorMsg.includes('key')) {
                throw e;
            }

            // Retry once for other transient errors
            if (retryCount < 1) {
                console.warn(`[DEBUG] Error fetching ${label}, retrying (${retryCount + 1}/1)...`, e.message);
                await delay(2000); // Wait 2 seconds before retry
                return attemptFetch(retryCount + 1);
            }
            throw e;
        }
    };

    return attemptFetch();
};



// Quick health check for API
export async function checkApiHealth(configOverride?: Partial<ProviderConfig>): Promise<{ ok: boolean; error?: string }> {
    try {
        const prompt = "Reply with just: ok";
        // Very short timeout for health check
        const config = await getConfig(configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        // Use a race with a short timeout
        const response = await Promise.race([
            provider.generate({ prompt }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Health check timed out")), 8000))
        ]);

        if (response.error) {
            throw new Error(response.error);
        }
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: formatError(e).error };
    }
}

export async function fetchRecon(company: string, position: string, configOverride?: Partial<ProviderConfig>): Promise<{ data?: CompanyReconData; error?: string }> {
    try {
        // Sanitize company name
        const sanitizedCompany = company.trim().replace(/['"]/g, '');

        if (!sanitizedCompany || sanitizedCompany.length < 2) {
            return { error: "Please enter a valid company name." };
        }

        const prompt = `
You are a business analyst providing company research for interview preparation.

TASK: Analyze the company "${sanitizedCompany}" for someone interviewing for a ${position} role.

INSTRUCTIONS:
1. If you recognize "${sanitizedCompany}" as a real company (tech startup, public company, etc.), provide accurate details.
2. If the company name is ambiguous (e.g., "League" could be League Inc, The League app, etc.), pick the most likely tech/business interpretation.
3. If you cannot identify the company at all, still provide a helpful response with "Unknown" fields and general advice.

REQUIRED JSON OUTPUT (use exactly these keys):
{
  "name": "Official Company Name",
  "ticker": "TICKER or Private",
  "industry": "Primary Industry",
  "description": "A 100-150 word executive summary describing what the company does, their main products/services, and recent news or growth areas relevant to a ${position} candidate.",
  "vibe": "3 culture keywords separated by commas",
  "business_model": "Brief explanation of how they make money",
  "competitors": ["Competitor1", "Competitor2", "Competitor3"]
}

EXAMPLE for company "Stripe":
{
  "name": "Stripe",
  "ticker": "Private",
  "industry": "Financial Technology (Fintech)",
  "description": "Stripe is a leading payment infrastructure company that enables businesses to accept payments online and in-person. Founded in 2010, Stripe provides APIs for payment processing, billing, fraud prevention, and financial services. They power payments for millions of businesses from startups to Fortune 500 companies. Recent focus areas include Stripe Atlas for company incorporation, Stripe Climate for carbon removal, and expansion into banking-as-a-service.",
  "vibe": "Fast-paced, Engineering-driven, Ambitious",
  "business_model": "Transaction fees (2.9% + $0.30 per transaction) and subscription fees for premium features",
  "competitors": ["Square", "PayPal", "Adyen"]
}

Now analyze "${sanitizedCompany}":`;

        const data = await fetchJSON(prompt, "Recon", configOverride);

        // Validate and sanitize the response
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid response format from AI");
        }

        // Ensure required fields exist with fallbacks
        const validatedData: CompanyReconData = {
            name: data.name || sanitizedCompany,
            ticker: data.ticker || "Unknown",
            industry: data.industry || "Technology",
            description: data.description || `${sanitizedCompany} is a company in the technology sector. Research more about them before your interview.`,
            vibe: data.vibe || "Professional, Dynamic, Growing",
            business_model: data.business_model || "Business model not available",
            competitors: Array.isArray(data.competitors) ? data.competitors.slice(0, 5) : []
        };

        return { data: validatedData };
    } catch (e: any) {
        console.error("[fetchRecon] Error:", e);

        // Return a graceful fallback instead of error
        const fallbackData: CompanyReconData = {
            name: company,
            ticker: "Unknown",
            industry: "Technology",
            description: `We couldn't retrieve detailed information about ${company}. This may be a private company or startup. We recommend researching their website and recent news before your interview.`,
            vibe: "Research needed",
            business_model: "Not available",
            competitors: []
        };

        // Only return error for critical failures, otherwise return fallback
        if (e.message?.includes("API key") || e.message?.includes("unauthorized")) {
            return formatError(e);
        }

        return { data: fallbackData };
    }
}

export async function fetchMatch(company: string, position: string, round: string, resume: string, stories: string, sources: string = "", jobContext: string = "", configOverride?: Partial<ProviderConfig>, companies: string[] = []): Promise<{ data?: MatchData; error?: string }> {
    try {
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}\n\nADDITIONAL SOURCES:\n${sources}`;
        const jobContextSection = jobContext ? `\n\nJOB POSTING CONTEXT:\n${jobContext}` : "";

        // Use all provided companies by default
        const selectedCompanies = companies.length > 0 ? companies : [];
        const companiesContext = selectedCompanies.length > 0
            ? `\n\nCOMPANIES TO HIGHLIGHT: ${selectedCompanies.join(", ")}`
            : "";

        const prompt = `
            Context: Interview at ${company} for the role of '${position}' (Round: ${round}).
            Candidate Context: ${fullContext}
            ${jobContextSection}
            ${companiesContext}

            Task:
            1. Write a COMPREHENSIVE, DETAILED "Tell me about yourself" script.
            2. **Length Goal**: 450-600 words (3-4 minutes spoken). THIS MUST BE LONG AND DETAILED.
            3. **Structure (4 Distinct Sections)**:
               - **Paragraph 1 (The Foundation)**: Education & early career context. Set the stage detailedly. (~80-100 words)
               - **Paragraph 2 (The Growth)**: Middleware/earlier relevant roles. Don't just list titles—explain *challenges* and *wins*. (~120-150 words)
               - **Paragraph 3 (The Peak)**: Most recent/senior roles. Deep dive into specific projects, leadership, and impact. (~120-150 words)
               - **Paragraph 4 ( The Alignment)**: Why you are here. Connect your specific "Peak" skills to [Company]'s mission/product. (~80-100 words)
            4. **Style**: Conversational but professional. "Let me walk you through my journey..."
            5. **CRITICAL**: Do NOT summarize. EXPAND on your points.

            CRITICAL RULES:
            - **NO NUMBERS/METRICS**: Do NOT include specific figures, percentages, or KPIs.
            - **FIRST PERSON**: "I started..."
            - **SOURCE OF TRUTH**: Use Candidate Context (Resume) only.
            - **MATCHED ENTITIES**: List the specific companies from the resume that you highlighted in your script. YOU MUST INCLUDE AT LEAST ONE.

            Return JSON:
            {
                "matched_entities": ["Company A", "Company B"],
                "headline": "A punchy 5-8 word headline for ${position}",
                "paragraph_1": "The Foundation (Detailed)",
                "paragraph_2": "The Growth (Detailed)",
                "paragraph_3": "The Peak (Detailed)",
                "paragraph_4": "The Alignment (Detailed)"
            }
        `;
        const data = await fetchJSON(prompt, "Match", configOverride);

        if (data && selectedCompanies.length > 0) {
            data.matched_entities = selectedCompanies;
        } else if (data && data.matched_entities) {
            // Sanitize: Ensure matched_entities is always string[]
            data.matched_entities = data.matched_entities.map((e: any) => {
                if (typeof e === 'string') return e;
                if (typeof e === 'object' && e !== null) {
                    return e.company_name || e.name || e.title || JSON.stringify(e);
                }
                return String(e);
            });
        }

        // Combine paragraphs into reasoning for frontend compatibility
        if (data) {
            const p1 = data.paragraph_1 || "";
            const p2 = data.paragraph_2 || "";
            const p3 = data.paragraph_3 || "";
            const p4 = data.paragraph_4 || "";
            data.reasoning = [p1, p2, p3, p4].filter(Boolean).join("\n\n");
        }

        return { data: data as MatchData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function extractCompaniesFromResume(resume: string, configOverride?: Partial<ProviderConfig>): Promise<{ data?: string[]; error?: string }> {
    try {
        const prompt = `
            Extract all distinct company names where this candidate has worked (EMPLOYERS ONLY), based on the Resume Summary below.
            
            CRITICAL RULES:
            1. EXCLUDE skills, programming languages, or tools (e.g., "Java", "Python", "AWS", "Azure", "React").
            2. EXCLUDE clients or projects if the candidate wasn't directly employed by them, unless it was a major contract role.
            3. ONLY include organizations where the candidate held a job title.
            
            Resume Summary:
            ${resume}

            Return JSON:
            { "companies": ["Company A", "Company B"] }
        `;
        const data = await fetchJSON(prompt, "ExtractCompanies", configOverride);
        return { data: data?.companies || [] };
    } catch (e: any) {
        console.error("Extract Companies Error:", e);
        return { data: [] };
    }
}


export async function fetchQuestions(
    company: string,
    position: string,
    round: string,
    configOverride?: Partial<ProviderConfig>,
    isRegeneration: boolean = false,
    count: number = 20
): Promise<{ data?: QuestionsData; error?: string }> {
    try {
        // Clamp count to reasonable limits
        const questionCount = Math.min(Math.max(count, 5), 30);

        const uniqueInstruction = isRegeneration
            ? "CRITICAL: Generate a COMPLETELY NEW and UNIQUE set of questions different from standard generic ones. Focus on niche, specific, or challenging aspects of this role/company to ensure variety."
            : "";

        const prompt = `
            Generate ${questionCount} interview questions for the role of ${position} at ${company} (Round: ${round}).
            ${uniqueInstruction}

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
        const data = await fetchJSON(prompt, "Questions", configOverride);
        return { data: data as QuestionsData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchReverse(
    company: string,
    position: string,
    round: string,
    resume: string,
    stories: string,
    sources: string = "",
    configOverride?: Partial<ProviderConfig>,
    count: number = 5
): Promise<{ data?: ReverseQuestionsData; error?: string }> {
    try {
        // Clamp count to reasonable limits
        const questionCount = Math.min(Math.max(count, 3), 15);

        const prompt = `
            Generate ${questionCount} strategic questions for the candidate to ask the interviewer at ${company} (${position}, ${round}).
            Focus on deep insights, not surface level.

            Return JSON: { "reverse_questions": [{ "type": "Category Name", "question": "The question text" }] }
        `;
        const data = await fetchJSON(prompt, "Reverse", configOverride);
        return { data: data as ReverseQuestionsData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchTechnicalQuestions(
    company: string,
    position: string,
    round: string,
    sources: string = "",
    configOverride?: Partial<ProviderConfig>,
    count: number = 5
): Promise<{ data?: TechnicalData; error?: string }> {
    try {
        // Clamp count to reasonable limits
        const questionCount = Math.min(Math.max(count, 3), 15);

        const prompt = `
            Context: ${company}, ${position}, ${round}. Sources: ${sources}
            Generate ${questionCount} conceptual technical questions (not coding).

            Return JSON:
            {
                "questions": [
                    { "topic": "Topic", "question": "Question text", "context_clue": "Hint" }
                ]
            }
        `;
        const data = await fetchJSON(prompt, "Technical", configOverride);
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

export async function fetchCodingChallenge(company: string, position: string, round: string, configOverride?: Partial<ProviderConfig>): Promise<{ data?: CodingChallenge; error?: string }> {
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
        const data = await fetchJSON(prompt, "Coding", configOverride);
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

export async function generateGenericJSON(prompt: string, configOverride?: Partial<ProviderConfig>): Promise<any> {
    try {
        return await fetchJSON(prompt, "Generic JSON", configOverride);
    } catch (e: any) {
        console.error("Generic JSON Error:", e);
        return null;
    }
}

export async function generateGenericText(prompt: string, configOverride?: Partial<ProviderConfig>): Promise<string> {
    try {
        const config = await getConfig(configOverride);
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

export async function analyzeJobPosting(jobText: string, configOverride?: Partial<ProviderConfig>): Promise<{ data?: { company: string; position: string; round: string }; error?: string }> {
    try {
        const prompt = `
            Analyze the following job posting text and extract:
            1. Company Name (if not explicitly stated, infer from context or return "Unknown Company")
            2. Position/Role Title
            3. Interview Round (default to "Behavioral" if not specified, or infer "Technical" if it contains coding/system design keywords)

            Job Text:
            "${jobText.substring(0, 3000)}"

            Return JSON:
            {
                "company": "Company Name",
                "position": "Job Title",
                "round": "Behavioral" | "Technical" | "System Design" | "Managerial"
            }
        `;
        const data = await fetchJSON(prompt, "JobAnalysis", configOverride);
        return { data: data as { company: string; position: string; round: string } };
    } catch (e: any) {
        return formatError(e);
    }
}

/**
 * Detect the role type for specialized questions
 */
type RoleType = 'engineering' | 'product' | 'design' | 'data' | 'other';

function detectRoleType(position: string, round: string): RoleType {
    const combinedText = `${position} ${round}`.toLowerCase();

    // Product Management keywords
    const pmKeywords = ['product manager', 'product lead', 'pm ', ' pm', 'product owner', 'product director', 'apm', 'gpm', 'head of product'];
    if (pmKeywords.some(kw => combinedText.includes(kw))) {
        return 'product';
    }

    // Engineering keywords
    const engineeringKeywords = [
        'engineer', 'developer', 'architect', 'swe', 'sde', 'software',
        'backend', 'frontend', 'fullstack', 'devops', 'sre', 'infrastructure',
        'platform', 'systems', 'technical', 'coding'
    ];
    if (engineeringKeywords.some(kw => combinedText.includes(kw))) {
        return 'engineering';
    }

    // Design keywords
    const designKeywords = ['designer', 'ux', 'ui', 'design lead', 'creative'];
    if (designKeywords.some(kw => combinedText.includes(kw))) {
        return 'design';
    }

    // Data keywords
    const dataKeywords = ['data scientist', 'data analyst', 'ml engineer', 'machine learning', 'analytics'];
    if (dataKeywords.some(kw => combinedText.includes(kw))) {
        return 'data';
    }

    return 'other';
}

/**
 * Detect seniority level from position title
 */
function detectSeniority(position: string): 'junior' | 'mid' | 'senior' | 'staff+' {
    const lower = position.toLowerCase();

    if (lower.includes('staff') || lower.includes('principal') || lower.includes('distinguished')) {
        return 'staff+';
    }
    if (lower.includes('senior') || lower.includes('lead')) {
        return 'senior';
    }
    if (lower.includes('junior') || lower.includes('entry') || lower.includes('associate')) {
        return 'junior';
    }

    return 'mid'; // Default
}

/**
 * Fetch role-specific deep-dive questions
 * Combines curated question bank with AI-generated questions
 * Works for: Engineering (System Design), Product (PM), Design, Data roles
 */
export async function fetchSystemDesignQuestions(
    company: string,
    position: string,
    round: string,
    configOverride?: Partial<ProviderConfig>,
    count: number = 10,
    onlyCurated: boolean = false
): Promise<{ data?: import('@/types').SystemDesignData; error?: string }> {
    try {
        // Clamp count to reasonable limits
        const questionCount = Math.min(Math.max(count, 3), 20);
        // Split between curated (70%) and AI-generated (30%)
        const curatedCount = Math.max(Math.floor(questionCount * 0.7), 2);
        const aiCount = Math.max(questionCount - curatedCount, 1);

        // 1. Detect role type
        const roleType = detectRoleType(position, round);
        const seniority = detectSeniority(position);

        // 2. Get questions based on role type
        let curatedQuestions: any[] = [];
        let questionType = 'Technical';

        if (roleType === 'product') {
            // Use PM question bank
            const { selectPMQuestions, detectPMSeniority } = await import('@/lib/knowledge/pm-questions');
            const pmSeniority = detectPMSeniority(position);

            // Determine PM categories based on round
            let pmCategories: any[] | undefined;
            const roundLower = round.toLowerCase();

            if (roundLower.includes('product sense') || roundLower.includes('product design')) {
                pmCategories = ['product-sense', 'design'];
            } else if (roundLower.includes('execution') || roundLower.includes('technical')) {
                pmCategories = ['execution', 'technical'];
            } else if (roundLower.includes('strategy') || roundLower.includes('case')) {
                pmCategories = ['strategy', 'estimation'];
            } else if (roundLower.includes('behavioral') || roundLower.includes('leadership')) {
                pmCategories = ['behavioral', 'execution'];
            } else {
                // Mix of all for general rounds
                pmCategories = ['product-sense', 'strategy', 'execution', 'estimation'];
            }

            curatedQuestions = selectPMQuestions(pmSeniority, curatedCount, pmCategories);
            questionType = 'Product Management';

        } else if (roleType === 'engineering') {
            // Use System Design question bank
            const { selectQuestions } = await import('@/lib/knowledge/system-design-questions');

            let categories: any[] | undefined;
            const roundLower = round.toLowerCase();

            if (roundLower.includes('system design') || roundLower.includes('architecture')) {
                categories = ['design', 'fundamentals', 'scalability'];
            } else if (roundLower.includes('technical') || roundLower.includes('coding')) {
                categories = ['fundamentals', 'scalability', 'distributed'];
            } else {
                categories = ['design', 'fundamentals', 'scalability'];
            }

            curatedQuestions = selectQuestions(position, seniority, curatedCount, categories);
            questionType = 'System Design';

        } else {
            // For other roles, generate AI questions only
            questionType = roleType === 'design' ? 'Design' : roleType === 'data' ? 'Data & Analytics' : 'General';
        }

        if (onlyCurated) {
            return {
                data: {
                    questions: curatedQuestions,
                    curatedCount: curatedQuestions.length,
                    aiGeneratedCount: 0,
                    roleType: roleType as string
                }
            };
        }

        // 3. Generate additional AI questions tailored to company and role
        let aiQuestions: any[] = [];
        try {
            const aiPrompt = roleType === 'product'
                ? `Generate ${aiCount} Product Management interview questions for a ${position} at ${company} (${round}).

                   Focus on:
                   - Product sense and user empathy
                   - Metrics and data-driven decision making
                   - Strategy relevant to ${company}'s business
                   - Execution and stakeholder management

                   Make questions appropriately challenging for a ${seniority} level candidate.`
                : roleType === 'engineering'
                    ? `Generate ${aiCount} system design/technical interview questions for a ${position} at ${company} (${round}).

                   Focus on:
                   - Architecture relevant to ${company}'s scale
                   - Distributed systems concepts
                   - Trade-offs and practical considerations

                   Make questions appropriately challenging for a ${seniority} level candidate.`
                    : `Generate ${aiCount} interview questions for a ${position} at ${company} (${round}).

                   Focus on role-specific skills and knowledge areas.
                   Make questions appropriately challenging for this level.`;

            const prompt = `${aiPrompt}

                Return JSON:
                {
                    "questions": [
                        {
                            "id": "ai-001",
                            "category": "${questionType}",
                            "difficulty": "${seniority}",
                            "question": "Question text",
                            "topics": ["topic1", "topic2"],
                            "keyPoints": ["Key point 1", "Key point 2"]
                        }
                    ]
                }
            `;

            const aiData = await fetchJSON(prompt, `AI ${questionType} Questions`, configOverride);
            if (aiData?.questions && Array.isArray(aiData.questions)) {
                aiQuestions = aiData.questions.map((q: any, idx: number) => ({
                    id: `ai-${idx + 1}`,
                    question: q.question || q,
                    category: questionType,
                    difficulty: seniority,
                    topics: q.topics || [],
                    keyPoints: q.keyPoints || []
                }));
            }
        } catch (e) {
            console.warn('Failed to generate AI questions, using curated only', e);
        }

        // 4. Combine and return
        const allQuestions = [...curatedQuestions, ...aiQuestions];

        return {
            data: {
                questions: allQuestions,
                curatedCount: curatedQuestions.length,
                aiGeneratedCount: aiQuestions.length,
                roleType: roleType as string
            }
        };
    } catch (e: any) {
        return formatError(e);
    }
}

/**
 * Generate a strict, calibrated critique of the user's answer
 * Anti-Hallucination & Anti-Passivity Feature
 */
export async function generateAnswerCritique(
    question: QuestionItem,
    userAnswer: string,
    context: { company: string; position: string; round: string; reconData?: CompanyReconData },
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: AnswerCritique; error?: string }> {
    try {
        const seniority = detectSeniority(context.position);

        // Anti-Hallucination: Explicitly instruct the AI to use ONLY proven facts if mentioning company specifics.
        const companyFacts = context.reconData
            ? `Verified Company Facts: ${JSON.stringify(context.reconData)}`
            : "No verified company data available. Do not invent specific product features or internal metrics.";

        const prompt = `
            You are a skeptical, high-bar interviewer at ${context.company} interviewing a candidate for a ${seniority} ${context.position} role.
            
            TASK: Critique the candidate's answer to the following question.
            
            QUESTION: "${question.question}"
            CANDIDATE ANSWER: "${userAnswer}"
            
            CONTEXT:
            - Role Level: ${seniority} (Adjust expectations accordingly. Junior = potential/grit. Senior = trade-offs/impact. Staff = strategy/influence).
            - Company Context: ${companyFacts}
            
            SCORING CRITERIA:
            1. **Specifics**: Did they vaguely mention "optimizing" or did they give numbers/metrics?
            2. **Structure**: Did they ramble or use a framework (STAR, etc)?
            3. **Relevance**: Did they answer the specific question asked?
            4. **Truthfulness**: If they made broad claims about ${context.company}, are they plausible?
            
            CRITICAL INSTRUCTIONS (ANTI-HALLUCINATION):
            - Do NOT invent "better" details about the company that you don't know for a fact.
            - Focus your critique on *structural* and *substantive* gaps in the user's answer.
            - If the user's answer is too short (under 50 words), give a low score and ask for more depth.
            
            RETURN JSON:
            {
                "score": 1-10 (number),
                "scoreLabel": "One word label (e.g., 'Weak', 'Passing', 'Strong', 'Exemplary')",
                "strengths": ["List of 2-3 things done well"],
                "weaknesses": ["List of 2-3 specific gaps"],
                "missing_nuances": ["List of 1-2 sophisticated points a ${seniority} candidate should have mentioned (e.g. 'Failed to discuss costs vs latency')"],
                "tone_analysis": "One sentence on their delivery (e.g. 'Too passive', 'Confident but vague')",
                "improved_version": "A rewritten, 'gold standard' version of their answer (max 100 words)"
            }
        `;

        const data = await fetchJSON(prompt, "Critique", configOverride);
        return { data: data as AnswerCritique };
    } catch (e: any) {
        return formatError(e);
    }
}


// UNIFIED FETCH FUNCTIONS

async function fetchUnifiedReconMatch(
    company: string,
    position: string,
    round: string,
    resume: string,
    stories: string,
    configOverride?: Partial<ProviderConfig>
): Promise<{ recon: CompanyReconData; match: MatchData } | { error: string }> {
    try {
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}`;
        const sanitizedCompany = company.trim().replace(/['"]/g, '');

        const prompt = `
            Context: Interview at ${sanitizedCompany} for '${position}' (Round: ${round}).
            Candidate Context: ${fullContext}

            Task: Perform TWO analyses in parallel.
            
            PART 1: COMPANY RECON
            Analyze ${sanitizedCompany}.
            - Description: 100-150 word executive summary.
            - Vibe: 3 culture keywords.
            - Business Model: How they make money.
            - Competitors: Top 3-5 competitors.

            PART 2: MATCH STRATEGY ("Tell me about yourself")
            Write a COMPREHENSIVE 450-600 word script in first-person ("I").
            Structure:
            1. The Foundation (Education/Early)
            2. The Growth (Middle career, challenges/wins)
            3. The Peak (Recent/Senior roles, specific impacts)
            4. The Alignment (Why ${sanitizedCompany}?)
            
            CRITICAL:
            - Use ONLY provided Candidate Context.
            - NO specific metrics/numbers unless in resume.
            - "reasoning" field should contain the consolidated script.
            - **matched_entities**: You MUST extract the list of companies mentioned in the script.

            Return JSON:
            {
                "recon": {
                    "name": "Official Name",
                    "ticker": "Ticker/Private",
                    "industry": "Industry",
                    "description": "...",
                    "vibe": "...",
                    "business_model": "...",
                    "competitors": ["A", "B"]
                },
                "match": {
                    "headline": "Punchy 5-8 word headline",
                    "reasoning": "Full 4-paragraph script...",
                    "matched_entities": ["Company A", "Company B"]
                }
            }
        `;

        const data = await fetchJSON(prompt, "Unified Recon/Match", configOverride);

        if (!data || !data.recon || !data.match) throw new Error("Incomplete unified response");

        // Validate and sanitize Recon Data
        const validatedRecon: CompanyReconData = {
            name: data.recon.name || sanitizedCompany,
            ticker: data.recon.ticker || "Unknown",
            industry: data.recon.industry || "Technology",
            description: data.recon.description || `${sanitizedCompany} is a company in the technology sector.`,
            vibe: data.recon.vibe || "Professional",
            business_model: data.recon.business_model || "Not available",
            competitors: Array.isArray(data.recon.competitors) ? data.recon.competitors.slice(0, 5) : []
        };

        return {
            recon: validatedRecon,
            match: {
                headline: data.match.headline,
                reasoning: data.match.reasoning,
                matched_entities: Array.isArray(data.match.matched_entities) ? data.match.matched_entities : []
            }
        };

    } catch (e: any) {
        return { error: e.message || "Unified generation failed" };
    }
}

async function fetchUnifiedQuestions(
    company: string,
    position: string,
    round: string,
    configOverride: Partial<ProviderConfig>,
    counts: {
        questions: number;
        reverse: number;
        technical: number;
        systemDesign: number;
        coding: boolean;
    },
    context: {
        roleType: string;
        seniority: string;
    }
): Promise<{
    questionsData: QuestionsData;
    reverseData: ReverseQuestionsData;
    technicalData?: TechnicalData;
    systemDesignData?: { questions: any[] };
    codingChallenge?: CodingChallenge;
} | { error: string }> {
    try {
        const { questions, reverse, technical, systemDesign, coding } = counts;

        const prompt = `
            Generate interview questions for ${position} at ${company} (${round}).
            Role Type: ${context.roleType}, Seniority: ${context.seniority}.

            TASKS:
            1. **General Questions** (${questions}): Behavioral, Knowledge, Case Study.
            2. **Reverse Questions** (${reverse}): Strategic questions to ask the interviewer.
            ${technical > 0 ? `3. **Technical Concepts** (${technical}): Conceptual questions (not coding).` : ""}
            ${systemDesign > 0 ? `4. **System Design/Product Questions** (${systemDesign}): Deep dive questions.` : ""}
            ${coding ? `5. **Coding Challenge**: One algorithm problem.` : ""}

            Return JSON:
            {
                "questions": [{ "id": "1", "category": "Behavioral", "question": "..." }],
                "reverse_questions": [{ "type": "Strategy", "question": "..." }],
                ${technical > 0 ? `"technical_questions": [{ "topic": "...", "question": "...", "context_clue": "..." }],` : ""}
                ${systemDesign > 0 ? `"system_design_questions": [{ "question": "...", "topics": [], "keyPoints": [] }],` : ""}
                ${coding ? `"coding_challenge": { "title": "...", "description": "...", "examples": [], "constraints": [], "starter_code": "..." }` : ""}
            }
        `;

        const data = await fetchJSON(prompt, "Unified Questions", configOverride);

        return {
            questionsData: { questions: data.questions || [] },
            reverseData: { reverse_questions: data.reverse_questions || [] },
            technicalData: data.technical_questions ? { questions: data.technical_questions } : undefined,
            systemDesignData: data.system_design_questions ? { questions: data.system_design_questions } : undefined,
            codingChallenge: data.coding_challenge
        };

    } catch (e: any) {
        return { error: e.message };
    }
}

/**
 * MASTER ORCHESTRATOR: FAANG-Style Backend Logic
 * Centralizes the entire interview prep generation flow on the server.
 * Enforces caching, rate limiting (via sequential/batching), and robust error handling.
 */
export async function generateInterviewPlan(
    company: string,
    position: string,
    round: string,
    resume: string,
    stories: string,
    settings: any,
    forceRefresh: boolean = false
): Promise<{
    reconData?: CompanyReconData;
    matchData?: MatchData;
    questionsData?: QuestionsData;
    reverseData?: ReverseQuestionsData;
    technicalData?: TechnicalData;
    codingChallenge?: CodingChallenge;
    systemDesignData?: SystemDesignData;
    error?: string;
    fromCache?: boolean;
}> {
    try {
        console.log("[Orchestrator] Received settings:", JSON.stringify({
            ...settings,
            modelConfig: {
                ...settings?.modelConfig,
                apiKey: settings?.modelConfig?.apiKey ? "***" : "MISSING"
            }
        }, null, 2));

        const cacheKey = `${company}-${position}-${round}`.toLowerCase();

        // 1. Check Server Cache (if not forced)
        if (!forceRefresh) {
            const { data: cached } = await fetchServerCache(cacheKey);
            if (cached) {
                return {
                    reconData: cached.reconData,
                    matchData: cached.matchData,
                    questionsData: cached.questionsData,
                    reverseData: cached.reverseData,
                    technicalData: cached.technicalData,
                    codingChallenge: cached.codingChallenge,
                    systemDesignData: cached.systemDesignData,
                    fromCache: true
                };
            }
        }

        // 2. UNIFIED CALL 1: Recon & Match
        // Generates company research and "Tell me about yourself" strategy in one go
        const reconMatchRes = await fetchUnifiedReconMatch(company, position, round, resume, stories, settings.modelConfig);

        if ('error' in reconMatchRes) {
            throw new Error(reconMatchRes.error);
        }

        const { recon: reconData, match: matchData } = reconMatchRes;

        // 3. Prepare Logic for Questions
        // Calculate needs for the second unified call
        const isTechnical = round.toLowerCase().includes('technical') ||
            position.toLowerCase().includes('engineer') ||
            position.toLowerCase().includes('developer') ||
            position.toLowerCase().includes('scientist') ||
            position.toLowerCase().includes('architect');

        const roleType = detectRoleType(position, round);
        const seniority = detectSeniority(position);

        // Get Curated System/PM Questions (No LLM Call)
        // We ask for the full count, and it returns what it has.
        // If we want to support the 70/30 split, we can adjust logic.
        // For optimization, getting purely curated here is fine, and we ask AI for the rest.
        const totalSysCount = settings.prepSettings?.systemDesign || 10;
        const sysRes = await fetchSystemDesignQuestions(company, position, round, settings.modelConfig, totalSysCount, true);
        const curatedQuestions = sysRes.data?.questions || [];

        // Calculate how many AI questions we need (e.g. 30% or remaining)
        // Original logic was roughly 70/30.
        // Let's aim for 3-5 AI questions to supplement.
        const aiSysCount = Math.max(Math.floor(totalSysCount * 0.3), 2); // Ensure at least a couple AI questions

        // 4. UNIFIED CALL 2: All Questions
        // Batches Interview Questions, Reverse Questions, Technical, System Design (AI part), Coding
        const questionsResKeys = await fetchUnifiedQuestions(company, position, round, settings.modelConfig, {
            questions: settings.prepSettings?.questions || 20,
            reverse: settings.prepSettings?.reverse || 5,
            technical: isTechnical ? (settings.prepSettings?.technical || 10) : 0,
            systemDesign: aiSysCount,
            coding: isTechnical // generate one challenge if technical
        }, {
            roleType,
            seniority
        });

        if ('error' in questionsResKeys) {
            throw new Error(questionsResKeys.error);
        }

        const { questionsData, reverseData, technicalData, codingChallenge, systemDesignData: aiSystemData } = questionsResKeys;

        // Merge System Design Questions
        const finalSystemDesignQuestions = [...curatedQuestions, ...(aiSystemData?.questions || [])].map((q, idx) => ({
            ...q // preserve properties
        }));

        const finalSystemDesignData: SystemDesignData = {
            questions: finalSystemDesignQuestions,
            curatedCount: curatedQuestions.length,
            aiGeneratedCount: aiSystemData?.questions?.length || 0,
            roleType: roleType
        };

        // 5. Save to Cache
        const now = Date.now();
        const expires = now + 24 * 60 * 60 * 1000;

        const fullData = {
            id: crypto.randomUUID(),
            cacheKey,
            company,
            position,
            round,
            reconData,
            matchData,
            questionsData,
            reverseData,
            technicalData,
            codingChallenge,
            systemDesignData: finalSystemDesignData,
            resumeCompanies: [],
            hasResumeContext: resume.length > 50,
            createdAt: now,
            expiresAt: expires
        };

        void saveServerCache(fullData as any);

        return {
            reconData,
            matchData,
            questionsData,
            reverseData,
            technicalData,
            codingChallenge,
            systemDesignData: finalSystemDesignData,
            fromCache: false
        };

    } catch (e: any) {
        console.error("[Orchestrator] Plan generation failed:", e);
        return { error: e.message || "Failed to generate interview plan" };
    }
}
