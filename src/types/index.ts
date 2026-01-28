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
    prompt?: string;
}

export interface QuestionItem {
    id: string;
    question: string;
    category: 'Behavioral' | 'Knowledge' | 'Coding' | 'Case Study' | 'Mock Scenario';
    tags?: string[];
}

export interface QuestionsData {
    questions: QuestionItem[];
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
    deleted?: boolean;
    tags?: string[];
}

export interface SourceItem {
    id: string;
    type: 'text' | 'url' | 'file';
    title: string;
    content: string;
    created_at?: string;
}

export interface TechnicalData {
    questions: {
        topic: string;
        question: string;
        context_clue: string;
    }[];
}

export interface CodingChallenge {
    title: string;
    description: string;
    examples: string[];
    constraints: string[];
    starter_code: string;
    solution_approach?: string;
}

export interface ProviderConfig {
    provider: 'groq' | 'gemini' | 'openai';
    apiKey: string;
    model: string;
}
