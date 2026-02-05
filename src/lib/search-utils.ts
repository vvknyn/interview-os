// Client-side search query parsing utilities

export interface ParsedSearch {
    company: string;
    position: string;
    round: string;
    error?: string;
}

// Normalize round names to standard values
function normalizeRound(roundInput: string): string {
    const r = roundInput.toLowerCase();
    if (r.includes("hr") || r.includes("phone") || r.includes("recruiter")) return "Recruiter Screen";
    if (r.includes("behav") || r.includes("cultur") || r.includes("fit")) return "Behavioral";
    if (r.includes("manager") || r.includes("hm")) return "Hiring Manager";
    if (r.includes("design") || r.includes("arch")) return "System Design";
    if (r.includes("site") || r.includes("final")) return "Onsite";
    return "Technical"; // Default
}

// Client-side quick parse function (no server round-trip needed)
export function quickParseSearchQuery(query: string): ParsedSearch | null {
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
        // Handle 2 parts: "Company, Position" -> assume Technical round
        if (parts.length === 2 && parts[0] && parts[1]) {
            return {
                company: parts[0],
                position: parts[1],
                round: "Technical"
            };
        }
    }

    // 2. Simple word-based heuristic
    const words = query.split(' ').filter(w => w.trim());
    if (words.length >= 2) {
        // Guess: First word is company. Last word might be round. Middle is position.
        const company = words[0];
        let round = "Technical";
        let position = words.slice(1).join(" ");

        // Check if last word resembles a round
        const lastWord = words[words.length - 1].toLowerCase();
        if (["technical", "behavioral", "manager", "hr", "phone", "coding", "design", "onsite", "final"].some(r => lastWord.includes(r))) {
            round = normalizeRound(lastWord);
            position = words.slice(1, words.length - 1).join(" ") || "Software Engineer";
        }

        return {
            company: company,
            position: position || "Software Engineer",
            round: round
        };
    }

    // Single word - treat as company
    if (words.length === 1) {
        return {
            company: words[0],
            position: "Software Engineer",
            round: "Technical"
        };
    }

    return null;
}
