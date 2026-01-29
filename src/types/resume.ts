export interface ResumeProfile {
    profession: string;
    yearsOfExperience: number;
    location: string;
    email: string;
    phone: string;
    linkedin?: string;
}

export interface ResumeExperience {
    id: string;
    company: string;
    role: string;
    dates: string;
    description: string;
}

export interface ResumeCompetencyCategory {
    category: string;
    skills: string[];
}

export interface ResumeData {
    profile: ResumeProfile;
    experience: ResumeExperience[];
    competencies: ResumeCompetencyCategory[];
    generatedSummary: string;
}

// Resume Tailoring Types
export interface JobAnalysis {
    id?: string;
    jobUrl?: string;
    jobText: string;
    companyName: string;
    positionTitle: string;
    extractedRequirements: string[];
    extractedSkills: string[];
    cultureIndicators: string[];
    seniorityLevel: string;
}

export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationCategory = 'summary' | 'experience' | 'skills' | 'overall';

export interface TailoringRecommendation {
    id: string;
    category: RecommendationCategory;
    priority: RecommendationPriority;
    title: string;
    original?: string;
    suggested: string;
    reasoning: string;
}

export interface ExperienceComparison {
    experienceId: string;
    original: string;
    tailored: string;
    changes: string[]; // List of what changed
}

export interface TailoredResumeVersion {
    id?: string;
    userId?: string;
    jobAnalysisId?: string;
    versionName: string;

    // Original snapshot
    originalSummary: string;
    originalExperience: ResumeExperience[];
    originalCompetencies: ResumeCompetencyCategory[];

    // Tailored content
    tailoredSummary: string;
    tailoredExperience: ResumeExperience[];
    tailoredCompetencies: ResumeCompetencyCategory[];

    // Recommendations
    recommendations: TailoringRecommendation[];

    // Metadata
    companyName: string;
    positionTitle: string;
    appliedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
