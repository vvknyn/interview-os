"use server";

import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData, TechnicalData, CodingChallenge } from "@/types";
import { fetchProfile } from "@/actions/profile";
import { ProviderFactory } from "@/lib/llm/providers";

const processEnv = process.env;

import { ProviderConfig } from "@/lib/llm/types";

// Helper to get configuration (Custom or Default)
const getConfig = async (override?: Partial<ProviderConfig>) => {
    try {
        // 1. Check Override first
        if (override?.apiKey && override?.provider) {
            return {
                apiKey: override.apiKey,
                provider: override.provider,
                model: override.model || (override.provider === 'gemini' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile')
            };
        }

        const { data } = await fetchProfile();

        // Parse preferred_model for provider:model format
        // Default: groq:llama-3.3-70b-versatile
        const rawModel = override?.model || data?.preferred_model || "groq:llama-3.3-70b-versatile";
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
    } catch (e: unknown) {
        // Fallback safety
        const apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY;
        if (!apiKey) throw new Error("Critical: No API Key available. " + (e instanceof Error ? e.message : ""));
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
    // Fallback logic could be complex with multi-provider. 
    // For now, let's keep it simple: reliable providers usually don't need complex model fallbacks 
    // IF the user supplies a valid key. 
    // We will implement simple retry for the *same* provider/model first.

    const attemptFetch = async (retryCount: number = 0): Promise<any> => {
        try {
            const config = await getConfig(configOverride);
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

export async function fetchRecon(company: string, position: string, configOverride?: Partial<ProviderConfig>): Promise<{ data?: CompanyReconData; error?: string }> {
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
        const data = await fetchJSON(prompt, "Recon", configOverride);
        return { data: data as CompanyReconData };
    } catch (e: any) {
        return formatError(e);
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
            1. Write a compelling "Tell me about yourself" script for this ${position} interview.
            2. The script MUST highlight experiences from these companies: ${selectedCompanies.length > 0 ? selectedCompanies.join(", ") : "all companies in the resume"}.
            3. If the candidate's past titles differ from "${position}", frame experiences to highlight TRANSFERABLE SKILLS.
            4. Write in FIRST PERSON as the exact words the candidate will speak.
            5. Keep it natural and professional - about 30-60 seconds when spoken (100-150 words).

            CRITICAL RULES:
            - **SOURCE OF TRUTH**: Use ONLY the Candidate Context (Resume/Stories) for facts about what the candidate has done. 
            - **JOB CONTEXT USAGE**: Use the Job Posting Context ONLY to prioritize *which* resume points to mention.
            - **NEGATIVE CONSTRAINT**: Do NOT say the candidate has done something just because it is in the Job Description. If it's not in the resume, they haven't done it.
            - **Frame**: "I have experience with X" (only if X is in resume) -> matches JD requirement Y.

            Return JSON:
            {
              "matched_entities": [${selectedCompanies.length > 0 ? selectedCompanies.map(c => `"${c}"`).join(", ") : '"Company1", "Company2"'}], // Company names ONLY as array of strings
              "headline": "A punchy 5-8 word headline for ${position}",
              "reasoning": "The full first-person script in markdown format"
            }
        `;
        const data = await fetchJSON(prompt, "Match", configOverride);

        // Ensure matched_entities contains the companies we specified
        if (data && selectedCompanies.length > 0) {
            data.matched_entities = selectedCompanies;
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


export async function fetchQuestions(company: string, position: string, round: string, configOverride?: Partial<ProviderConfig>): Promise<{ data?: QuestionsData; error?: string }> {
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
        const data = await fetchJSON(prompt, "Questions", configOverride);
        return { data: data as QuestionsData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchReverse(company: string, position: string, round: string, resume: string, stories: string, sources: string = "", configOverride?: Partial<ProviderConfig>): Promise<{ data?: ReverseQuestionsData; error?: string }> {
    try {
        const prompt = `
            Generate 5 strategic questions for the candidate to ask the interviewer at ${company} (${position}, ${round}).
            Focus on deep insights, not surface level.
            
            Return JSON: { "reverse_questions": ["Question 1", ...] }
        `;
        const data = await fetchJSON(prompt, "Reverse", configOverride);
        return { data: data as ReverseQuestionsData };
    } catch (e: any) {
        return formatError(e);
    }
}

export async function fetchTechnicalQuestions(company: string, position: string, round: string, sources: string = "", configOverride?: Partial<ProviderConfig>): Promise<{ data?: TechnicalData; error?: string }> {
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
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: import('@/types').SystemDesignData; error?: string }> {
    try {
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

            curatedQuestions = selectPMQuestions(pmSeniority, 10, pmCategories);
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

            curatedQuestions = selectQuestions(position, seniority, 10, categories);
            questionType = 'System Design';

        } else {
            // For other roles, generate AI questions only
            questionType = roleType === 'design' ? 'Design' : roleType === 'data' ? 'Data & Analytics' : 'General';
        }

        // 3. Generate additional AI questions tailored to company and role
        let aiQuestions: any[] = [];
        try {
            const aiPrompt = roleType === 'product'
                ? `Generate 3 Product Management interview questions for a ${position} at ${company} (${round}).

                   Focus on:
                   - Product sense and user empathy
                   - Metrics and data-driven decision making
                   - Strategy relevant to ${company}'s business
                   - Execution and stakeholder management

                   Make questions appropriately challenging for a ${seniority} level candidate.`
                : roleType === 'engineering'
                    ? `Generate 3 system design/technical interview questions for a ${position} at ${company} (${round}).

                   Focus on:
                   - Architecture relevant to ${company}'s scale
                   - Distributed systems concepts
                   - Trade-offs and practical considerations

                   Make questions appropriately challenging for a ${seniority} level candidate.`
                    : `Generate 3 interview questions for a ${position} at ${company} (${round}).

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

