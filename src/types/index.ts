export interface CompanyReconData {
    name: string;
    ticker?: string;
    industry?: string;
    description: string;
    vibe?: string;
    business_model?: string;
    competitors?: string[];
}

export interface MatchData {
    matched_entities: string[];
    headline: string;
    reasoning: string;
}

export interface QuestionsData {
    questions: string[];
}

export interface ReverseQuestionsData {
    reverse_questions: string[];
}

export interface StarStory {
    id: string;
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
}
