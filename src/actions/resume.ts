"use server";

import { createClient } from "@/lib/supabase/server";
import { ResumeData, ResumeProfile, ResumeExperience, ResumeCompetencyCategory, ResumeEducation } from "@/types/resume";
import { generateGenericJSON } from "@/actions/generate-context";
import { ProviderConfig } from "@/lib/llm/types";

export const maxDuration = 60; // Allow up to 60 seconds for resume parsing

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
 * Fetch structured resume data from database.
 * If resume_data is missing but resume_text exists, auto-rebuilds via AI.
 */
export async function fetchResumeData(): Promise<{ data?: ResumeData; source?: string; confidence?: number; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Not signed in" };
        }

        // Try fetching with all columns
        const { data, error } = await supabase
            .from("profiles")
            .select("resume_data, resume_text, resume_import_source, resume_import_confidence")
            .eq("id", user.id)
            .single();

        if (error) {
            // Primary query failed (e.g. resume_data column missing) — try fallback
            console.warn("[Resume] Primary fetch failed, trying fallback:", error.message);

            const { data: fallback, error: fallbackErr } = await supabase
                .from("profiles")
                .select("resume_text")
                .eq("id", user.id)
                .single();

            if (fallbackErr) {
                return { error: "Failed to load profile data. Please try again." };
            }

            // Auto-rebuild structured data from text
            if (fallback?.resume_text && fallback.resume_text.trim().length >= 50) {
                console.warn("[Resume] Fallback auto-rebuild skipped.");
                // return await rebuildResumeFromText(fallback.resume_text);
            }

            return { data: undefined };
        }

        // Primary query succeeded — check for structured data first
        if (data?.resume_data) {
            return {
                data: data.resume_data as ResumeData,
                source: data.resume_import_source,
                confidence: data.resume_import_confidence
            };
        }

        // resume_data is null — auto-rebuild from resume_text if available
        // DISABLE auto-rebuild to prevent rate limit loops
        if (data?.resume_text && data.resume_text.trim().length >= 50) {
            console.warn("[Resume] Auto-rebuild from text skipped to prevent rate limiting. User should trigger manual rebuild.");
            // return await rebuildResumeFromText(data.resume_text);
        }

        // No resume data at all
        return { data: undefined };
    } catch (e: any) {
        console.error("[Resume] Fetch Exception:", e);
        return { error: "Failed to load resume. Please try again." };
    }
}

/**
 * Auto-rebuild structured ResumeData from plain text using AI,
 * then persist it back to the database so future fetches are instant.
 */
async function rebuildResumeFromText(
    resumeText: string
): Promise<{ data?: ResumeData; source?: string; confidence?: number; error?: string }> {
    try {
        console.log("[Resume] Auto-rebuilding structured data from resume_text...");
        const parseResult = await parseResumeWithAI(resumeText, 'text');

        if (parseResult.error || !parseResult.data?.parsed) {
            console.warn("[Resume] Auto-rebuild failed:", parseResult.error);
            return { error: "Failed to process resume data. Please re-import your resume in the Resume Builder." };
        }

        const rebuilt = parseResult.data.parsed;
        const confidence = parseResult.data.confidence.overall;

        // Persist rebuilt data so this only happens once
        await saveResumeData(rebuilt, 'text', confidence);

        return { data: rebuilt, source: 'text', confidence };
    } catch (e: any) {
        console.error("[Resume] Auto-rebuild exception:", e);
        return { error: "Failed to process resume data. Please try again." };
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

        // 1. Generate text representation for RAG/Context (Dashboard compatibility)
        const resumeText = resumeDataToText(resumeData);

        // 2. Try to update everything first (resume_data + resume_text)
        // If 'resume_data' column is missing, this will fail.
        try {
            const updateData: Record<string, any> = {
                resume_data: resumeData,
                resume_text: resumeText,
                resume_last_updated: new Date().toISOString()
            };

            if (importSource) updateData.resume_import_source = importSource;
            if (confidence !== undefined) updateData.resume_import_confidence = confidence;

            const { error } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("id", user.id);

            if (!error) return {}; // Success

            // If error is about missing column, fall back
            console.warn("[Resume] Primary save failed, attempting fallback to resume_text only:", error.message);

        } catch (e) {
            console.warn("[Resume] Primary save exception:", e);
        }

        // 3. Fallback: Save ONLY resume_text (and text-based fields) for Dashboard compatibility
        // This ensures the "Resume Required" state is cleared even if structured storage fails
        const { error: fallbackError } = await supabase
            .from("profiles")
            .update({
                resume_text: resumeText
            })
            .eq("id", user.id);

        if (fallbackError) {
            console.error("[Resume] Fallback Save Error:", fallbackError);
            return { error: fallbackError.message };
        }

        return {};
    } catch (e: any) {
        console.error("[Resume] Save Exception:", e);
        return { error: e.message };
    }
}

/**
 * Convert structured ResumeData to plain text for RAG/Context
 */
function resumeDataToText(data: ResumeData): string {
    const parts = [];

    // Profile
    if (data.profile) {
        const p = data.profile;
        parts.push(`Name/Contact: ${p.profession} | ${p.email} | ${p.location}`);
    }

    // Summary
    if (data.generatedSummary) {
        parts.push(`SUMMARY:\n${data.generatedSummary}`);
    }

    // Experience
    if (data.experience && data.experience.length > 0) {
        parts.push("EXPERIENCE:");
        data.experience.forEach(exp => {
            parts.push(`${exp.role} at ${exp.company} (${exp.dates})\n${exp.description}`);
        });
    }

    // Skills
    if (data.competencies && data.competencies.length > 0) {
        parts.push("SKILLS:");
        data.competencies.forEach(comp => {
            parts.push(`${comp.category}: ${comp.skills.join(", ")}`);
        });
    }

    // Education
    if (data.education && data.education.length > 0) {
        parts.push("EDUCATION:");
        data.education.forEach(edu => {
            parts.push(`${edu.degree} at ${edu.institution} (${edu.year})`);
        });
    }

    return parts.join("\n\n");
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
               - profession: The person's FULL NAME (not job title - we need their actual name for the header)
               - yearsOfExperience (estimated from work history, number)
               - location (city, state/country)
               - email
               - phone
               - linkedin (URL or username)

            2. **Work Experience** (each entry):
               - company name
               - role/title
               - dates (e.g., "Jan 2020 - Present")
               - description (bullet points as single string with newlines - preserve ALL bullet points)

            3. **Skills/Competencies** (group by category):
               - Each category should have a name and list of skills
               - Common categories: Programming Languages, Frameworks, Tools, Cloud/DevOps, Soft Skills

            4. **Education** (each entry):
               - degree
               - institution
               - year (graduation year)

            5. **Professional Summary**:
               - **CRITICAL**: Extract the summary section (usually at the top).
               - Look for titles like: "Summary", "Professional Summary", "Profile", "About Me", "Objective", "Career Summary", "Executive Summary", "Professional Profile", "Bio".
               - If an explicit section exists, extract the text EXACTLY as written.
               - If NO explicit summary section exists, you MUST generate a high-quality 3-4 sentence professional summary based on the candidate's experience and skills.
               - Do NOT leave this field empty. either extract it or generate it.

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
                    "generatedSummary": "Results-driven software engineer with 5+ years of experience building scalable web applications. Proven track record of leading cross-functional teams and delivering complex projects on time. Passionate about clean code, performance optimization, and mentoring junior developers."
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
            - SUMMARY: Extract the FULL summary text if it exists. Look carefully for any paragraph at the top of the resume that describes the person's career. This is usually 2-5 sentences.
            - PROFESSION field should contain the person's FULL NAME (e.g., "John Smith"), not their job title
            - Preserve ALL bullet points in experience descriptions - do not summarize or truncate
        `;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result) {
            return { error: "No response from AI. Please check your API key configuration in the model switcher and try again." };
        }

        if (!result.parsed) {
            // If we got a result but no parsed data, it might be an error embedded in the response
            const errorHint = result.error || result.message || "";
            if (errorHint) {
                return { error: `AI parsing failed: ${errorHint}` };
            }
            return { error: "Failed to parse resume structure. The AI response was incomplete. Please try again or use a different AI provider." };
        }

        // Helper to normalize newlines - converts literal \n strings to actual newlines
        // and ensures bullet points are on separate lines
        const normalizeDescription = (desc: string): string => {
            if (!desc) return "";

            // Replace literal \n with actual newlines
            let normalized = desc.replace(/\\n/g, '\n');

            // Also handle cases where bullets are run together without newlines
            // e.g., "• Point 1• Point 2" -> "• Point 1\n• Point 2"
            normalized = normalized.replace(/([^\n])([•\-\*])\s/g, '$1\n$2 ');

            // Normalize multiple newlines to double newlines max
            normalized = normalized.replace(/\n{3,}/g, '\n\n');

            return normalized.trim();
        };

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
                    description: normalizeDescription(exp.description || "")
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
            generatedSummary: (result.parsed.generatedSummary || "").replace(/\\n/g, '\n').trim()
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
 * Uses unpdf (pdf.js-based) for robust text extraction
 */
export async function extractPDFText(fileBase64: string): Promise<{ text?: string; error?: string }> {
    try {
        if (!fileBase64 || fileBase64.length < 100) {
            return { error: "Invalid PDF data received. Please try uploading again." };
        }

        // Convert base64 to Buffer, then to Uint8Array (required by unpdf)
        let uint8: Uint8Array;
        try {
            const buffer = Buffer.from(fileBase64, 'base64');
            // Validate PDF header
            const header = buffer.slice(0, 5).toString('ascii');
            if (!header.startsWith('%PDF')) {
                return { error: "The file does not appear to be a valid PDF. Please check the file format." };
            }
            uint8 = new Uint8Array(buffer);
        } catch {
            return { error: "Failed to process PDF file. The file may be corrupted." };
        }

        // Extract text using unpdf
        const { extractText } = await import('unpdf');

        let pages: string[];
        let totalPages: number;
        try {
            const result = await extractText(uint8);
            pages = result.text;
            totalPages = result.totalPages;
        } catch (parseError: unknown) {
            const msg = (parseError as Error).message || '';
            if (/password/i.test(msg)) {
                return { error: "This PDF is password-protected. Please unlock it or paste the text directly." };
            }
            if (/encrypt/i.test(msg)) {
                return { error: "This PDF is encrypted. Please use an unencrypted version or paste the text directly." };
            }
            return { error: `Could not parse PDF: ${msg}. Please try pasting the content directly.` };
        }

        // Join all pages
        const rawText = pages.join('\n\n');

        if (!rawText || rawText.trim().length < 20) {
            return {
                error: "No text could be extracted from this PDF. It may be an image-based/scanned document. Please paste your resume text instead."
            };
        }

        // Clean up: collapse excessive whitespace while preserving structure
        const cleanedText = rawText
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        console.log(`[Resume] PDF extraction successful: ${totalPages} pages, ${cleanedText.length} chars`);
        return { text: cleanedText };
    } catch (e: unknown) {
        console.error("[Resume] PDF Extract Error:", e);
        const errorMsg = (e as Error).message || "Unknown error";
        return { error: `Failed to extract text from PDF: ${errorMsg}. Please try pasting the content directly.` };
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
