/**
 * Utility functions to optimize text content for LLM processing
 * Reduces token usage by removing stop words and unnecessary characters
 */

// Safe list of stop words that usually don't change meaning if removed from context-heavy prompts
// Excludes negations ("no", "not") and key prepositions that might alter relationships
const STOP_WORDS = new Set([
    "a", "an", "the",
    "and", "or", "but", "nor", // conjunctions
    "is", "are", "was", "were", "be", "been", "being", // to require/state existence
    "have", "has", "had", "having",
    "do", "does", "did", "doing",
    "it", "its", "it's", "they", "them", "their", "theirs", "we", "us", "our", "ours",
    "you", "your", "yours", "he", "him", "his", "she", "her", "hers",
    "that", "this", "these", "those",
    "to", "of", "in", "on", "at", "by", "from", "with", "about", "as", "into", "onto",
    "very", "really", "just", "so", "too", // intensifiers
    "can", "could", "will", "would", "shall", "should", "may", "might" // modals (often implied)
]);

/**
 * Optimizes text for LLM consumption by:
 * 1. Normalizing whitespace
 * 2. Removing special characters/noise (while preserving structure markers)
 * 3. Removing common stop words
 */
export function optimizeTextForLLM(text: string): string {
    if (!text) return "";

    // 1. Normalize whitespace (tabs, multiple spaces, newlines to single space)
    // We preserve newlines if likely structural (e.g. lists), but for raw text usually space is fine
    // Actually, for readability/structure, let's keep single newlines but squash multiples
    let processed = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    processed = processed.replace(/[ \t]+/g, " "); // squash horizontal whitespace
    processed = processed.replace(/\n{3,}/g, "\n\n"); // max 2 newlines

    // 2. Remove special characters that are purely decorative or noise
    // Keep: alphanumeric, basic punctuation (.,!?-:;), brackets (), quotes "'", email @, currency $€£, percent %, slash /
    // Remove: unusual symbols often found in PDF artifacts (• is useful for lists, so keep it)
    // We'll replace sequences of non-basic-printable chars with space
    // Regex explanation: Keep \w (word), \s (space), and .,!?-:;()'"@$€£%/\•
    processed = processed.replace(/[^\w\s\.,!\?\-:;\(\)'"@$€£%\/•\n]/g, " ");

    // 3. Remove stop words
    // Split by whitespace
    const words = processed.split(/(\s+)/); // keep delimiters to preserve spacing structure

    const optimizedWords = words.map(word => {
        // Only process actual words (not whitespace)
        if (!word.trim()) return word;

        // Check if it's a stop word
        // Remove punctuation from edges for checking
        const bareWord = word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");

        // Don't remove if it's potentially important (e.g. "a" as a variable name? Unlikely in prose)
        if (STOP_WORDS.has(bareWord)) {
            return ""; // remove it
        }
        return word;
    });

    // Rejoin and clean up resulting multiple spaces from removals
    processed = optimizedWords.join("").replace(/  +/g, " ").trim();

    return processed;
}

/**
 * Lightweight optimization that only normalizes whitespace and removes excessive special chars
 * Use this when specific wording/grammar is critical (e.g. for strict extraction)
 */
export function normalizeTextOnly(text: string): string {
    if (!text) return "";
    let processed = text.replace(/\s+/g, " ").trim();
    processed = processed.replace(/[^\w\s\.,!\?\-:;\(\)'"@$€£%\/•]/g, "");
    return processed;
}
