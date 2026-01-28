"use server";

import { generateGenericJSON } from "@/actions/generate-context";

export interface ParsedSearch {
    company: string;
    position: string;
    round: string;
    error?: string;
}

export async function parseSearchQuery(query: string): Promise<ParsedSearch | null> {
    if (!query || !query.trim()) return null;

    // 1. Attempt Regex / Heuristic Parsing first (Fastest)
    // Common format: "Company, Position, Round" or "Company Position Round"
    // Heuristic: If there are commas, use them as delimiters.
    if (query.includes(',')) {
        const parts = query.split(',').map(s => s.trim());
        if (parts.length >= 3) {
            return {
                company: parts[0],
                position: parts[1],
                round: normalizeRound(parts[2])
            };
        }
    }

    // 2. Fallback: LLM Parsing (Robust)
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

        const result = await generateGenericJSON(prompt);

        if (result && result.company && result.position) {
            return {
                company: result.company,
                position: result.position,
                round: normalizeRound(result.round || "Technical")
            };
        }
    } catch (e) {
        console.error("LLM Parsing failed, trying fallback regex", e);
    }

    // 3. Last Resort: Simple Split (Heuristic)
    // Assume: "Company Position Round" (3 words minimum)
    const words = query.split(' ');
    if (words.length >= 2) {
        // Guess: First word is company. Last word might be round. Middle is position.
        const company = words[0];
        let round = "Technical";
        let position = words.slice(1).join(" ");

        // Check if last word resembles a round
        const lastWord = words[words.length - 1].toLowerCase();
        if (["technical", "behavioral", "manager", "hr", "phone", "coding", "design"].some(r => lastWord.includes(r))) {
            round = normalizeRound(lastWord);
            position = words.slice(1, words.length - 1).join(" ");
        }

        return {
            company: company,
            position: position || "Software Engineer", // Fallback
            round: round
        };
    }

    return {
        company: query,
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
