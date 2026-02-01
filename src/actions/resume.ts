"use server";

import { createClient } from "@/lib/supabase/server";
import { ResumeData, ResumeProfile, ResumeExperience, ResumeCompetencyCategory, ResumeEducation } from "@/types/resume";
import { generateGenericJSON } from "@/actions/generate-context";
import { ProviderConfig } from "@/lib/llm/types";

/**
 * Confidence scores for AI parsing
 */
export interface ResumeConfidenceScores {
    overall: number;
    profile: number;
    experience: number;
    competencies: number;
    education: number;
    summary: number;
}

/**
 * Uncertain field marker for user review
 */
export interface UncertainField {
    field: string;
    reason: string;
    section: 'profile' | 'experience' | 'competencies' | 'education' | 'summary';
}

/**
 * Result from AI-powered resume parsing
 */
export interface ParsedResumeResult {
    parsed: ResumeData;
    confidence: ResumeConfidenceScores;
    uncertainFields: UncertainField[];
    warnings: string[];
}

/**
 * Fetch structured resume data from database
 */
export async function fetchResumeData(): Promise<{ data?: ResumeData; source?: string; confidence?: number; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("resume_data, resume_import_source, resume_import_confidence")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("[Resume] Fetch Error:", error);
            return { data: undefined };
        }

        return {
            data: data?.resume_data as ResumeData | undefined,
            source: data?.resume_import_source,
            confidence: data?.resume_import_confidence
        };
    } catch (e: any) {
        console.error("[Resume] Fetch Exception:", e);
        return { error: e.message };
    }
}

/**
 * Save structured resume data to database
 */
export async function saveResumeData(
    resumeData: ResumeData,
    importSource?: 'pdf' | 'docx' | 'text' | 'manual',
    confidence?: number
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        console.log("[Resume] Saving resume data for:", user.id);

        const updateData: Record<string, any> = {
            resume_data: resumeData,
            resume_last_updated: new Date().toISOString()
        };

        if (importSource) {
            updateData.resume_import_source = importSource;
        }
        if (confidence !== undefined) {
            updateData.resume_import_confidence = confidence;
        }

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

        if (error) {
            console.error("[Resume] Save Error:", error);
            return { error: error.message };
        }

        return {};
    } catch (e: any) {
        console.error("[Resume] Save Exception:", e);
        return { error: e.message };
    }
}

/**
 * AI-powered resume parsing with confidence scores
 */
export async function parseResumeWithAI(
    content: string,
    contentType: 'pdf' | 'docx' | 'text',
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: ParsedResumeResult; error?: string }> {
    try {
        if (!content || content.trim().length < 50) {
            return { error: "Resume content too short. Please provide more text." };
        }

        const prompt = `
            You are an expert resume parser. Analyze the following resume text and extract structured information.

            RESUME TEXT:
            """
            ${content.substring(0, 10000)}
            """

            Extract the following information:

            1. **Profile Information**:
               - profession (job title / current role)
               - yearsOfExperience (estimated from work history, number)
               - location (city, state/country)
               - email
               - phone
               - linkedin (URL or username)

            2. **Work Experience** (each entry):
               - company name
               - role/title
               - dates (e.g., "Jan 2020 - Present")
               - description (bullet points as single string with newlines)

            3. **Skills/Competencies** (group by category):
               - Each category should have a name and list of skills
               - Common categories: Programming Languages, Frameworks, Tools, Cloud/DevOps, Soft Skills

            4. **Education** (each entry):
               - degree
               - institution
               - year (graduation year)

            5. **Professional Summary** (if present, or generate a brief one)

            CONFIDENCE SCORING (0-100):
            - Rate your confidence for each section based on:
              - How clearly the information was stated
              - Whether you had to make assumptions
              - Quality of the extracted data

            UNCERTAINTY FLAGS:
            - List any fields where you're uncertain about the extraction
            - Provide a reason for each uncertain field

            Return ONLY valid JSON in this exact format:
            {
                "parsed": {
                    "profile": {
                        "profession": "Software Engineer",
                        "yearsOfExperience": 5,
                        "location": "San Francisco, CA",
                        "email": "email@example.com",
                        "phone": "+1-555-123-4567",
                        "linkedin": "linkedin.com/in/username"
                    },
                    "experience": [
                        {
                            "id": "exp-1",
                            "company": "Company Name",
                            "role": "Job Title",
                            "dates": "Jan 2020 - Present",
                            "description": "• Achievement 1\\n• Achievement 2"
                        }
                    ],
                    "competencies": [
                        {
                            "category": "Programming Languages",
                            "skills": ["Python", "JavaScript", "TypeScript"]
                        }
                    ],
                    "education": [
                        {
                            "id": "edu-1",
                            "degree": "Bachelor of Science in Computer Science",
                            "institution": "University Name",
                            "year": "2018"
                        }
                    ],
                    "generatedSummary": "Experienced software engineer with 5+ years..."
                },
                "confidence": {
                    "overall": 85,
                    "profile": 90,
                    "experience": 85,
                    "competencies": 80,
                    "education": 95,
                    "summary": 75
                },
                "uncertainFields": [
                    {
                        "field": "yearsOfExperience",
                        "reason": "Estimated from work history, may not be accurate",
                        "section": "profile"
                    }
                ],
                "warnings": [
                    "Some dates could not be parsed accurately"
                ]
            }

            CRITICAL RULES:
            - Generate unique IDs for experience and education entries (exp-1, exp-2, edu-1, etc.)
            - If a section is missing, use empty arrays or default values
            - Be conservative with confidence scores - lower is better than overconfident
            - Include all warnings about parsing issues
        `;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result || !result.parsed) {
            return { error: "Failed to parse resume. Please try again or paste text directly." };
        }

        // Validate and sanitize the parsed data
        const parsed: ResumeData = {
            profile: {
                profession: result.parsed.profile?.profession || "",
                yearsOfExperience: Number(result.parsed.profile?.yearsOfExperience) || 0,
                location: result.parsed.profile?.location || "",
                email: result.parsed.profile?.email || "",
                phone: result.parsed.profile?.phone || "",
                linkedin: result.parsed.profile?.linkedin || ""
            },
            experience: Array.isArray(result.parsed.experience)
                ? result.parsed.experience.map((exp: any, idx: number) => ({
                    id: exp.id || `exp-${idx + 1}`,
                    company: exp.company || "",
                    role: exp.role || "",
                    dates: exp.dates || "",
                    description: exp.description || ""
                }))
                : [],
            competencies: Array.isArray(result.parsed.competencies)
                ? result.parsed.competencies.map((comp: any) => ({
                    category: comp.category || "Skills",
                    skills: Array.isArray(comp.skills) ? comp.skills : []
                }))
                : [],
            education: Array.isArray(result.parsed.education)
                ? result.parsed.education.map((edu: any, idx: number) => ({
                    id: edu.id || `edu-${idx + 1}`,
                    degree: edu.degree || "",
                    institution: edu.institution || "",
                    year: edu.year || ""
                }))
                : [],
            generatedSummary: result.parsed.generatedSummary || ""
        };

        const confidence: ResumeConfidenceScores = {
            overall: Number(result.confidence?.overall) || 70,
            profile: Number(result.confidence?.profile) || 70,
            experience: Number(result.confidence?.experience) || 70,
            competencies: Number(result.confidence?.competencies) || 70,
            education: Number(result.confidence?.education) || 70,
            summary: Number(result.confidence?.summary) || 70
        };

        const uncertainFields: UncertainField[] = Array.isArray(result.uncertainFields)
            ? result.uncertainFields.map((field: any) => ({
                field: field.field || "",
                reason: field.reason || "",
                section: field.section || "profile"
            }))
            : [];

        const warnings: string[] = Array.isArray(result.warnings) ? result.warnings : [];

        // Add automatic warnings based on confidence
        if (confidence.overall < 70) {
            warnings.unshift("The AI had difficulty parsing your resume. Please review all sections carefully.");
        }
        if (confidence.experience < 70) {
            warnings.push("Some work experience entries may have parsing errors. Please verify dates and descriptions.");
        }
        if (confidence.competencies < 70) {
            warnings.push("Skills were found but could not be categorized automatically.");
        }

        return {
            data: {
                parsed,
                confidence,
                uncertainFields,
                warnings
            }
        };
    } catch (e: any) {
        console.error("[Resume] Parse Error:", e);
        return { error: e.message || "Failed to parse resume" };
    }
}

/**
 * Extract text from PDF file (server-side)
 */
export async function extractPDFText(fileBase64: string): Promise<{ text?: string; error?: string }> {
    try {
        // Dynamic import to avoid bundling issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');

        // Convert base64 to buffer
        const buffer = Buffer.from(fileBase64, 'base64');

        const data = await pdfParse(buffer);

        if (!data.text || data.text.trim().length < 50) {
            return { error: "Could not extract text from PDF. The file may be image-based or protected." };
        }

        return { text: data.text };
    } catch (e: any) {
        console.error("[Resume] PDF Extract Error:", e);
        return { error: "Failed to extract text from PDF. Please try pasting the content directly." };
    }
}

/**
 * Extract text from DOCX file (server-side)
 */
export async function extractDocxText(fileBase64: string): Promise<{ text?: string; error?: string }> {
    try {
        // Dynamic import to avoid bundling issues
        const mammoth = await import('mammoth');

        // Convert base64 to buffer
        const buffer = Buffer.from(fileBase64, 'base64');

        const result = await mammoth.extractRawText({ buffer });

        if (!result.value || result.value.trim().length < 50) {
            return { error: "Could not extract text from DOCX. The file may be empty or corrupted." };
        }

        return { text: result.value };
    } catch (e: any) {
        console.error("[Resume] DOCX Extract Error:", e);
        return { error: "Failed to extract text from DOCX. Please try pasting the content directly." };
    }
}
