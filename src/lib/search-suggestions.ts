export const POPULAR_COMPANIES = [
    "Google", "Amazon", "Meta", "Apple", "Microsoft", "Netflix",
    "Stripe", "Uber", "Airbnb", "Datadog", "Salesforce", "Oracle",
    "Spotify", "Tesla", "Nvidia", "Adobe", "LinkedIn", "Twitter"
];

export const POPULAR_ROLES = [
    "Software Engineer", "Product Manager", "Data Scientist",
    "Engineering Manager", "Frontend Engineer", "Backend Engineer",
    "Machine Learning Engineer", "Site Reliability Engineer",
    "Technical Program Manager", "System Administrator", "DevOps Engineer"
];

export const POPULAR_ROUNDS = [
    "Technical", "Behavioral", "System Design", "Hiring Manager", "HR Screening", "Coding"
];

export interface SearchSuggestion {
    text: string;
    type: 'company' | 'role' | 'history' | 'full';
}

export function getSuggestions(query: string, history: string[] = []): SearchSuggestion[] {
    if (!query || query.trim().length === 0) return history.map(h => ({ text: h, type: 'history' }));

    const lowerQuery = query.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // 1. History matches (high priority)
    const historyMatches = history
        .filter(h => h.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map(h => ({ text: h, type: 'history' as const }));

    suggestions.push(...historyMatches);

    // 2. Company Matches
    const companyMatches = POPULAR_COMPANIES
        .filter(c => c.toLowerCase().startsWith(lowerQuery))
        .slice(0, 3)
        .map(c => ({ text: c, type: 'company' as const }));

    suggestions.push(...companyMatches);

    // 3. Role Matches (if query looks like a role or generic)
    const roleMatches = POPULAR_ROLES
        .filter(r => r.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .map(r => ({ text: r, type: 'role' as const }));

    suggestions.push(...roleMatches);

    // 4. Combined Suggestions (Company + Generic Role)
    // If the query is a company name, suggest common roles at that company
    const exactCompany = POPULAR_COMPANIES.find(c => c.toLowerCase() === lowerQuery);
    if (exactCompany) {
        suggestions.push(
            { text: `${exactCompany} Software Engineer`, type: 'full' },
            { text: `${exactCompany} Product Manager`, type: 'full' },
            { text: `${exactCompany} System Design`, type: 'full' }
        );
    }

    // 5. Deduplicate
    const uniqueSuggestions = suggestions.filter((v, i, a) => a.findIndex(t => t.text === v.text) === i);

    return uniqueSuggestions.slice(0, 8); // Max 8 suggestions
}
