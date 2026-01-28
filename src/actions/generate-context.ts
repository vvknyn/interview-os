"use server";

import Groq from "groq-sdk";
import { CompanyReconData, MatchData, QuestionsData, ReverseQuestionsData } from "@/types";

const processEnv = process.env;

const getApiKey = () => processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY;

const getClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");
    return new Groq({ apiKey });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatGroqError = (e: any) => {
    console.error("Groq Generation Error:", e);
    let errorMessage = "An unexpected error occurred.";
    if (e.message) {
        if (e.message.includes("429") || e.message.includes("rate limit")) {
            errorMessage = "🚨 API Rate Limit Exceeded (429). Please try again later.";
        } else if (e.message.includes("401") || e.message.includes("unauthorized")) {
            errorMessage = "🚫 Unauthorized (401). Please check your GROQ_API_KEY.";
        } else {
            errorMessage = `Groq Error: ${e.message}`;
        }
    } else {
        errorMessage = JSON.stringify(e);
    }
    return { error: errorMessage };
};

const fetchJSON = async (prompt: string, label: string) => {
    try {
        const groq = getClient();
        console.log(`[DEBUG] Fetching ${label}...`);

        // Safety delay to prevent rapid-fire 429s
        await delay(1000);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt + "\n\nIMPORTANT: Return ONLY valid JSON."
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(text);
    } catch (e) {
        throw e;
    }
};

export async function fetchRecon(company: string, position: string): Promise<{ data?: CompanyReconData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const prompt = `
            CRITICAL: You MUST provide information about the company "${company}" ONLY. Do NOT substitute a different company.
            If you are unsure about "${company}", provide your best knowledge about that specific company, not a similar one.
            
            Analyze company '${company}' for a candidate applying to the '${position}' role. 
            Provide a comprehensive 15-20 line executive summary covering mission, recent news, strategic direction, and culture. 
            Focus on aspects relevant to ${position} roles. Format with Markdown.
            
            IMPORTANT: The "name" field MUST be exactly "${company}" or the full legal name of "${company}".
            
            Return JSON: { "name": "Name", "ticker": "Ticker", "industry": "Industry", "description": "Long detailed description (markdown)", "vibe": "Vibe", "business_model": "Model (markdown)", "competitors": ["C1", "C2", "C3"] }
        `;
        const data = await fetchJSON(prompt, "Recon");
        return { data: data as CompanyReconData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function fetchMatch(company: string, position: string, round: string, resume: string, stories: string): Promise<{ data?: MatchData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}`;
        const prompt = `
            Context: Candidate is interviewing at ${company} for a ${position} role, currently in the ${round} round.
            Full Context: ${fullContext}
            Task: Identify up to 5 relevant professional experiences (companies or roles) from the Resume Context that are best suited for a ${position} role in a ${round} interview.
            IMPORTANT: Write the "reasoning" as a VERBATIM spoken script in the FIRST PERSON. Do not list stats immediately. Start with a professional summary, then weave in the Selected Experiences naturally. This is the exact text the candidate will say when asked 'Tell me about yourself'.
            Return JSON: { "matched_entities": ["Experience1", "Experience2"], "headline": "Headline", "reasoning": "Reasoning (markdown, verbatim script)" }
        `;
        const data = await fetchJSON(prompt, "Match");
        return { data: data as MatchData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function fetchQuestions(company: string, position: string, round: string): Promise<{ data?: QuestionsData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const prompt = `
            CRITICAL: Generate questions specifically for "${company}" ONLY. Do NOT substitute a different company.
            
            Target: ${company}. Position: ${position}. Round: ${round}.
            Generate 20 specific interview questions for a ${position} role at ${company} during a ${round} interview.
            
            Questions should reference ${company}'s specific products, culture, or industry when relevant.
            
            Return JSON: { "questions": ["Q1", "Q2", ... "Q20"] }
        `;
        const data = await fetchJSON(prompt, "Questions");
        return { data: data as QuestionsData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function fetchReverse(company: string, position: string, round: string, resume: string, stories: string): Promise<{ data?: ReverseQuestionsData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}`;
        const prompt = `
            Target: ${company}. Position: ${position}. Round: ${round}.
            Candidate Profile: ${fullContext}
            Generate 5 strategic, high-level questions for a ${position} candidate to ask the interviewer at the end of a ${round} interview at ${company}.
            Tailor these questions based on the candidate's background (Resume Context) and the specific interview round.
            Focus on growth, challenges, and culture relevant to the ${position} role.
            Return JSON: { "reverse_questions": ["Q1", "Q2", "Q3", "Q4", "Q5"] }
        `;
        const data = await fetchJSON(prompt, "Reverse");
        return { data: data as ReverseQuestionsData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function generateGenericJSON(prompt: string): Promise<any> {
    try {
        if (!getApiKey()) throw new Error("Missing API Key");
        return await fetchJSON(prompt, "Generic JSON");
    } catch (e: any) {
        console.error("Generic JSON Error:", e);
        return null;
    }
}

export async function generateGenericText(prompt: string): Promise<string> {
    try {
        const groq = getClient();
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile"
        });
        return completion.choices[0]?.message?.content || "Error generating text.";
    } catch (e: any) {
        console.error("Generic Text Error:", e);
        return "Error generating text.";
    }
}
