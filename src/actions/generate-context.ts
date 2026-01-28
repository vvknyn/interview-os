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

export async function fetchRecon(company: string): Promise<{ data?: CompanyReconData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const prompt = `Analyze company '${company}'. Provide a comprehensive 15-20 line executive summary covering mission, recent news, strategic direction, and culture. Format with Markdown. Return JSON: { "name": "Name", "ticker": "Ticker", "industry": "Industry", "description": "Long detailed description (markdown)", "vibe": "Vibe", "business_model": "Model (markdown)", "competitors": ["C1", "C2", "C3"] }`;
        const data = await fetchJSON(prompt, "Recon");
        return { data: data as CompanyReconData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function fetchMatch(company: string, round: string, resume: string, stories: string): Promise<{ data?: MatchData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}`;
        const prompt = `
            Context: Vivek is interviewing at ${company} for a ${round} round.
            Full Context: ${fullContext}
            Task: Identify up to 5 relevant professional experiences (companies or roles) from the Resume Context that are best suited for this specific interview round.
            IMPORTANT: Write the "reasoning" as a VERBATIM spoken script in the FIRST PERSON. Do not list stats immediately. Start with a professional summary, then weave in the Selected Experiences naturally. This is the exact text the candidate will say when asked 'Tell me about yourself'.
            Return JSON: { "matched_entities": ["Experience1", "Experience2"], "headline": "Headline", "reasoning": "Reasoning (markdown, verbatim script)" }
        `;
        const data = await fetchJSON(prompt, "Match");
        return { data: data as MatchData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function fetchQuestions(company: string, round: string): Promise<{ data?: QuestionsData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const prompt = `
            Target: ${company}. Round: ${round}.
            Generate 20 specific interview questions.
            Return JSON: { "questions": ["Q1", "Q2", ... "Q20"] }
        `;
        const data = await fetchJSON(prompt, "Questions");
        return { data: data as QuestionsData };
    } catch (e: any) {
        return formatGroqError(e);
    }
}

export async function fetchReverse(company: string, round: string, resume: string, stories: string): Promise<{ data?: ReverseQuestionsData; error?: string }> {
    try {
        if (!getApiKey()) return { error: "Missing API Key" };
        const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}`;
        const prompt = `
            Target: ${company}. Round: ${round}.
            Candidate Profile: ${fullContext}
            Generate 5 strategic, high-level questions for the candidate to ask the interviewer at the end.
            Tailor these questions based on the candidate's background (Resume Context) and the specific interview round.
            Focus on growth, challenges, and culture.
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
