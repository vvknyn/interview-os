"use server";

import { createClient } from "@/lib/supabase/server";
import { ResumeData, ResumeProfile, ResumeExperience, ResumeCompetencyCategory, ResumeEducation, ResumeConfidenceScores, UncertainField, ParsedResumeResult } from "@/types/resume";
import { generateGenericJSON } from "@/actions/generate-context";
import { ProviderConfig } from "@/lib/llm/types";

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

            5. **Professional Summary** - THIS IS CRITICAL:
               - FIRST: Look for sections titled: "Summary", "Professional Summary", "Profile", "About", "Objective", "Career Summary", "Executive Summary", "Professional Profile"
               - If found, extract the ENTIRE text EXACTLY as written (preserve all sentences)
               - The summary is typically 2-5 sentences near the top of the resume, before experience
               - Do NOT truncate or shorten it
               - If no summary exists, generate a brief 2-3 sentence summary based on their experience

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

        if (result.error && !result.parsed) {
            return { error: result.error };
        }

        if (!result.parsed) {
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
 * Uses pdf-parse v2.x library with PDFParse class
 */
export async function extractPDFText(fileBase64: string): Promise<{ text?: string; error?: string }> {
    try {
        console.log("[Resume] Starting PDF extraction, base64 length:", fileBase64.length);

        // Validate input
        if (!fileBase64 || fileBase64.length < 100) {
            return { error: "Invalid PDF data received. Please try uploading again." };
        }

        // Convert base64 to buffer
        let buffer: Buffer;
        try {
            buffer = Buffer.from(fileBase64, 'base64');
            console.log("[Resume] Buffer created, size:", buffer.length, "bytes");
        } catch (bufferError) {
            console.error("[Resume] Buffer conversion error:", bufferError);
            return { error: "Failed to process PDF file. The file may be corrupted." };
        }

        // Check if the buffer looks like a PDF (starts with %PDF)
        const header = buffer.slice(0, 5).toString('ascii');
        if (!header.startsWith('%PDF')) {
            console.error("[Resume] Invalid PDF header:", header);
            return { error: "The file does not appear to be a valid PDF. Please check the file format." };
        }

        // Dynamic import pdf-parse v2.x (externalized)
        let PDFParse: any;
        try {
            const pdfModule = await import('pdf-parse');

            // Handle different export structures (CJS/ESM interop)
            const moduleAny = pdfModule as any;
            if (moduleAny.PDFParse) {
                PDFParse = moduleAny.PDFParse;
            } else if (moduleAny.default && moduleAny.default.PDFParse) {
                PDFParse = moduleAny.default.PDFParse;
            } else if (moduleAny.default) {
                // Some versions export the function directly as default
                // But v2 seems to export class. Let's try both.
                PDFParse = moduleAny.default;
            }

            console.log("[Resume] PDFParse loaded. Type:", typeof PDFParse);
        } catch (importError) {
            console.error("[Resume] pdf-parse import error:", importError);
            return { error: "PDF parsing library not available. Please paste your resume text instead." };
        }

        if (!PDFParse) {
            console.error("[Resume] PDFParse class not found in module");
            return { error: "PDF parsing library not available. Please paste your resume text instead." };
        }

        // Parse the PDF using v2 API
        let text: string;
        try {
            console.log("[Resume] Creating PDFParse instance...");
            // Check if it's a class (constructor) or function
            if (PDFParse.prototype && PDFParse.prototype.getText) {
                const parser = new PDFParse({ data: buffer });
                console.log("[Resume] Calling getText()...");
                const result = await parser.getText();
                text = result.text || "";
            } else {
                // Fallback to function call (v1 style)
                console.log("[Resume] Calling PDFParse as function...");
                const result = await PDFParse(buffer);
                text = result.text || "";
            }
            console.log("[Resume] getText completed, length:", text.length);
        } catch (parseError: any) {
            console.error("[Resume] pdf-parse error:", parseError);

            if (parseError.message?.includes('password') || parseError.message?.includes('Password')) {
                return { error: "This PDF is password-protected. Please unlock it or paste the text directly." };
            }
            if (parseError.message?.includes('encrypt') || parseError.message?.includes('Encrypt')) {
                return { error: "This PDF is encrypted. Please use an unencrypted version or paste the text directly." };
            }

            return { error: `Could not parse PDF: ${parseError.message}. Please try pasting the content directly.` };
        }

        // Validate extracted text
        if (!text || text.trim().length < 20) {
            return {
                error: "No text could be extracted from this PDF. It may be an image-based/scanned document. Please paste your resume text instead."
            };
        }

        // Clean up the text
        const cleanedText = text
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return { text: cleanedText };
    } catch (e: any) {
        console.error("[Resume] PDF Extract Error:", e);

        // Provide a user-friendly error message
        const errorMsg = e.message || "Unknown error";
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
