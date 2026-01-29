import { ResumeData, ResumeExperience, ResumeProfile, ResumeCompetencyCategory } from '@/types/resume';

const MOCK_SKILLS_DB: Record<string, ResumeCompetencyCategory[]> = {
    'Software Engineer': [
        { category: 'Languages', skills: ['TypeScript', 'JavaScript', 'Python', 'Go'] },
        { category: 'Frameworks', skills: ['React', 'Next.js', 'Node.js', 'Express'] },
        { category: 'Tools', skills: ['Git', 'Docker', 'AWS', 'PostgreSQL'] },
    ],
    'Product Manager': [
        { category: 'Strategy', skills: ['Product Strategy', 'Roadmapping', 'Market Research'] },
        { category: 'Execution', skills: ['Agile', 'Scrum', 'Jira', 'A/B Testing'] },
        { category: 'Leadership', skills: ['Stakeholder Management', 'Cross-functional Leadership'] },
    ],
    'Data Scientist': [
        { category: 'Languages', skills: ['Python', 'R', 'SQL'] },
        { category: 'ML/AI', skills: ['TensorFlow', 'PyTorch', 'Scikit-learn'] },
        { category: 'Data Viz', skills: ['Tableau', 'PowerBI', 'Matplotlib'] },
    ],
};

const DEFAULT_SKILLS: ResumeCompetencyCategory[] = [
    { category: 'Core Skills', skills: ['Communication', 'Problem Solving', 'Teamwork'] },
    { category: 'Technical', skills: ['Microsoft Office', 'Project Management'] },
    { category: 'Tools', skills: ['Slack', 'Zoom', 'Trello'] },
];

export async function inferCompetenciesFromExperience(
    profession: string,
    experience: ResumeExperience[]
): Promise<ResumeCompetencyCategory[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple keyword matching or default lookup
    // In a real app, this would send descriptions to an LLM

    const found = Object.entries(MOCK_SKILLS_DB).find(([key]) =>
        profession.toLowerCase().includes(key.toLowerCase())
    );

    return found ? found[1] : [];
}

export async function generateProfessionalSummary(
    profile: ResumeProfile,
    competencies: ResumeCompetencyCategory[],
    experiences: ResumeExperience[]
): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const topSkills = competencies.flatMap(c => c.skills).slice(0, 4).join(', ');
    const recentRole = experiences[0] ? experiences[0].role : profile.profession;

    // Sophisticated "Who I am + What I solve + How I do it" formula
    return `Dynamic ${profile.profession} with ${profile.yearsOfExperience}+ years of experience driving impact in ${profile.location} and beyond. Expert at leveraging ${topSkills} to solve complex technical challenges and deliver scalable solutions. ${recentRole ? `Previously as ${recentRole},` : 'Recently,'} consistently exceeded performance metrics by optimizing workflows and engineering robust systems. passionate about building high-performance products that drive measurable business growth.`;
}
