"use server";

import { generateGenericJSON } from "@/actions/generate-context";
import { ProviderConfig } from "@/lib/llm/types";
import { quickParseSearchQuery, ParsedSearch } from "@/lib/search-utils";

export type { ParsedSearch } from "@/lib/search-utils";

// Server-side parse with LLM fallback
export async function parseSearchQuery(query: string, modelConfig?: Partial<ProviderConfig>): Promise<ParsedSearch | null> {
    if (!query || !query.trim()) return null;

    // 1. Try quick parse first (no LLM needed for well-formatted queries)
    const quickResult = quickParseSearchQuery(query);
    if (quickResult) {
        return quickResult;
    }

    // 2. Fallback: LLM Parsing (Robust) - with timeout
    try {
        const prompt = `
            You are parsing an interview preparation search query. Extract EXACTLY what the user is asking for.

            Query: "${query}"

            CRITICAL RULES:
            1. COMPANY: The first word/phrase is almost always the company name.
            2. POSITION: Look for job titles (e.g., "Software Engineer", "PM", "Product Manager", "Designer").
               - If missing or generic, assume "Software Engineer" relative to context, or "General Role".
            3. ROUND: Interview round type. Normalize to: "Recruiter Screen", "Technical", "System Design", "Behavioral", "Hiring Manager", "Onsite".
               - If "coding", "algo", "leetcode" -> "Technical"
               - If "culture", "fit" -> "Behavioral"
               - If unspecified, assume "Technical".

            Examples:
            - "google swe" -> { "company": "Google", "position": "Software Engineer", "round": "Technical" }
            - "amazon pm behavioral" -> { "company": "Amazon", "position": "Product Manager", "round": "Behavioral" }
            - "netflix frontend system design" -> { "company": "Netflix", "position": "Frontend Engineer", "round": "System Design" }

            Return ONLY valid JSON: { "company": "...", "position": "...", "round": "..." }
        `;

        // Add timeout for LLM call
        const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 15000); // 15 second timeout
        });

        const llmPromise = generateGenericJSON(prompt, modelConfig);
        const result = await Promise.race([llmPromise, timeoutPromise]);

        if (result && result.company && result.position) {
            // Normalize round
            const normalizeRound = (r: string) => {
                const lower = r.toLowerCase();
                if (lower.includes("hr") || lower.includes("phone") || lower.includes("recruiter")) return "Recruiter Screen";
                if (lower.includes("behav") || lower.includes("cultur") || lower.includes("fit")) return "Behavioral";
                if (lower.includes("manager") || lower.includes("hm")) return "Hiring Manager";
                if (lower.includes("design") || lower.includes("arch")) return "System Design";
                if (lower.includes("site") || lower.includes("final")) return "Onsite";
                return "Technical";
            };

            return {
                company: result.company,
                position: result.position,
                round: normalizeRound(result.round || "Technical")
            };
        }
    } catch (e) {
        console.error("LLM Parsing failed, using fallback", e);
    }

    // 3. Last Resort: Return basic parse
    return {
        company: query.split(' ')[0] || query,
        position: "Software Engineer",
        round: "Technical",
        error: "Could not fully parse. Using defaults."
    };
}

function normalizeRound(roundInput: string): string {
    const r = roundInput.toLowerCase();
    if (r.includes("hr") || r.includes("phone") || r.includes("recruiter")) return "Recruiter Screen";
    if (r.includes("behav") || r.includes("cultur") || r.includes("fit")) return "Behavioral";
    if (r.includes("manager") || r.includes("hm")) return "Hiring Manager";
    if (r.includes("design") || r.includes("arch")) return "System Design";
    if (r.includes("site") || r.includes("final")) return "Onsite";
    return "Technical"; // Default
}
