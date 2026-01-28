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
