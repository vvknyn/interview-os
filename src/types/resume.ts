export interface ResumeProfile {
    profession: string;
    yearsOfExperience: number;
    location: string;
    email: string;
    phone: string;
    linkedin?: string;
}

export type ResumeSection = 'summary' | 'skills' | 'experience' | 'education' | 'projects';
export type ProfessionType = 'engineering' | 'product' | 'design' | 'data' | 'business' | 'general';

// Helper to detect profession type from title
export function detectProfessionType(profession: string): ProfessionType {
    const lower = profession.toLowerCase();

    if (lower.includes('engineer') || lower.includes('developer') || lower.includes('architect') ||
        lower.includes('devops') || lower.includes('sre') || lower.includes('software') ||
        lower.includes('frontend') || lower.includes('backend') || lower.includes('fullstack')) {
        return 'engineering';
    }
    if (lower.includes('product') || lower.includes('program') || lower.includes('project') ||
        lower.includes('scrum') || lower.includes('agile')) {
        return 'product';
    }
    if (lower.includes('design') || lower.includes('ux') || lower.includes('ui') ||
        lower.includes('creative') || lower.includes('graphic')) {
        return 'design';
    }
    if (lower.includes('data') || lower.includes('analyst') || lower.includes('analytics') ||
        lower.includes('scientist') || lower.includes('ml') || lower.includes('machine learning')) {
        return 'data';
    }
    if (lower.includes('business') || lower.includes('finance') || lower.includes('consultant') ||
        lower.includes('strategy') || lower.includes('operations') || lower.includes('sales') ||
        lower.includes('marketing')) {
        return 'business';
    }
    return 'general';
}

// Get optimal section order based on experience and profession
export function getSectionOrder(yearsOfExperience: number, professionType: ProfessionType): ResumeSection[] {
    const isFresher = yearsOfExperience < 3;

    // Freshers: Education first, then skills, then experience
    if (isFresher) {
        switch (professionType) {
            case 'engineering':
                return ['summary', 'skills', 'education', 'experience'];
            case 'design':
                return ['summary', 'skills', 'education', 'experience'];
            case 'data':
                return ['summary', 'skills', 'education', 'experience'];
            default:
                return ['summary', 'education', 'skills', 'experience'];
        }
    }

    // Experienced: Experience first, then skills
    switch (professionType) {
        case 'engineering':
            return ['summary', 'skills', 'experience', 'education'];
        case 'product':
            return ['summary', 'experience', 'skills', 'education'];
        case 'data':
            return ['summary', 'skills', 'experience', 'education'];
        case 'business':
            return ['summary', 'experience', 'skills', 'education'];
        default:
            return ['summary', 'experience', 'skills', 'education'];
    }
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

export interface ResumeEducation {
    id: string;
    degree: string;
    institution: string;
    year?: string;
}

export interface ResumeData {
    profile: ResumeProfile;
    experience: ResumeExperience[];
    competencies: ResumeCompetencyCategory[];
    education: ResumeEducation[];
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
