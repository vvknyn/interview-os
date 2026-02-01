"use server";

import { JobAnalysis, TailoringRecommendation, TailoredResumeVersion, ResumeData, ResumeExperience } from "@/types/resume";
import { generateGenericJSON, generateGenericText } from "@/actions/generate-context";
import { ProviderConfig } from "@/lib/llm/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Analyze a job posting to extract requirements, skills, and other key information
 */
export async function analyzeJobRequirements(
    jobText: string,
    jobUrl?: string,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: JobAnalysis; error?: string }> {
    try {
        const prompt = `
            Analyze this job posting and extract key information.
            
            Job Posting:
            """
            ${jobText.substring(0, 5000)}
            """
            
            Extract the following information:
            1. **Company Name**: The hiring company
            2. **Position Title**: The exact job title
            3. **Requirements**: List of required qualifications, skills, experiences (prioritize "must-haves")
            4. **Skills**: Technical and soft skills mentioned
            5. **Culture Indicators**: Values, culture mentions, team structure clues
            6. **Seniority Level**: Entry, Mid, Senior, Staff, Principal, or Executive
            
            CRITICAL: Be specific and extract actual requirements from the text. Don't add generic items.
            
            Return ONLY valid JSON in this exact format:
            {
                "companyName": "Company Name",
                "positionTitle": "Job Title",
                "extractedRequirements": ["Requirement 1", "Requirement 2", ...],
                "extractedSkills": ["Skill 1", "Skill 2", ...],
                "cultureIndicators": ["Culture aspect 1", "Culture aspect 2", ...],
                "seniorityLevel": "Senior"
            }
        `;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result) {
            return { error: "Failed to analyze job posting" };
        }

        const analysis: JobAnalysis = {
            jobText,
            jobUrl,
            companyName: result.companyName || "Unknown Company",
            positionTitle: result.positionTitle || "Unknown Position",
            extractedRequirements: result.extractedRequirements || [],
            extractedSkills: result.extractedSkills || [],
            cultureIndicators: result.cultureIndicators || [],
            seniorityLevel: result.seniorityLevel || "Mid"
        };

        // Save to database if user is authenticated
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: savedAnalysis, error: dbError } = await supabase
                    .from('job_analyses')
                    .insert({
                        user_id: user.id,
                        job_url: jobUrl,
                        job_text: jobText,
                        company_name: analysis.companyName,
                        position_title: analysis.positionTitle,
                        extracted_requirements: analysis.extractedRequirements,
                        extracted_skills: analysis.extractedSkills,
                        culture_indicators: analysis.cultureIndicators,
                        seniority_level: analysis.seniorityLevel
                    })
                    .select()
                    .single();

                if (!dbError && savedAnalysis) {
                    analysis.id = savedAnalysis.id;
                }
            }
        } catch (dbError) {
            console.error("Failed to save job analysis to DB:", dbError);
            // Don't fail the entire operation if DB save fails
        }

        return { data: analysis };
    } catch (e: any) {
        console.error("Job analysis error:", e);
        return { error: e.message || "Failed to analyze job posting" };
    }
}

/**
 * Generate tailoring recommendations by comparing resume against job requirements
 */
export async function generateTailoringRecommendations(
    resumeData: ResumeData,
    jobAnalysis: JobAnalysis,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: TailoringRecommendation[]; error?: string }> {
    try {
        const resumeContext = `
            CURRENT RESUME:
            
            Summary: ${resumeData.generatedSummary || "No summary yet"}
            
            Experience:
            ${resumeData.experience.map((exp, idx) => `
                ${idx + 1}. ${exp.role} at ${exp.company} (${exp.dates})
                ${exp.description}
            `).join('\n')}
            
            Core Competencies:
            ${resumeData.competencies.map(cat => `
                ${cat.category}: ${cat.skills.join(', ')}
            `).join('\n')}
        `;

        const jobContext = `
            TARGET JOB:
            Company: ${jobAnalysis.companyName}
            Position: ${jobAnalysis.positionTitle}
            Seniority: ${jobAnalysis.seniorityLevel}
            
            Requirements: ${jobAnalysis.extractedRequirements.join(', ')}
            Skills Needed: ${jobAnalysis.extractedSkills.join(', ')}
            Culture: ${jobAnalysis.cultureIndicators.join(', ')}
        `;

        const prompt = `
            You are an expert resume coach. Compare this candidate's resume against a job posting and provide specific, actionable recommendations.
            
            ${resumeContext}
            
            ${jobContext}
            
            CRITICAL INSTRUCTIONS:
            1. **Be Specific**: Reference exact bullet points or experiences from the resume
            2. **Be Authentic**: Only suggest reframing existing experience, never fabricate
            3. **Prioritize**: Mark as "high" priority if it addresses a critical requirement gap
            4. **Be Actionable**: Provide concrete suggested text, not vague advice
            
            Provide recommendations in these categories:
            - **summary**: Professional summary rewrites
            - **experience**: Specific bullet point rewrites to emphasize relevant aspects
            - **skills**: Competency reorganization or emphasis suggestions
            - **overall**: High-level strategic advice
            
            For each recommendation:
            - If rewriting text, provide both original and suggested versions
            - Explain WHY this change helps (which requirement it addresses)
            - Assign priority: "high" (critical gap), "medium" (good to have), "low" (nice polish)
            
            Return ONLY valid JSON with this structure:
            {
                "recommendations": [
                    {
                        "id": "rec-1",
                        "category": "summary",
                        "priority": "high",
                        "title": "Reframe summary for senior technical role",
                        "original": "Current summary text...",
                        "suggested": "Improved summary text...",
                        "reasoning": "Job requires X years in Y, your summary should emphasize..."
                    },
                    {
                        "id": "rec-2",
                        "category": "experience",
                        "priority": "medium",
                        "title": "Emphasize React experience in Company X role",
                        "original": "Original bullet point...",
                        "suggested": "Reframed bullet point...",
                        "reasoning": "Posting mentions React heavily. This bullet can highlight..."
                    }
                ]
            }
            
            Aim for 8-12 high-quality recommendations across all categories.
        `;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result || !result.recommendations) {
            return { error: "Failed to generate recommendations" };
        }

        return { data: result.recommendations };
    } catch (e: any) {
        console.error("Recommendation generation error:", e);
        return { error: e.message || "Failed to generate recommendations" };
    }
}

/**
 * Generate a custom professional summary for a specific job
 */
export async function generateCustomSummary(
    resumeData: ResumeData,
    jobAnalysis: JobAnalysis,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: string; error?: string }> {
    try {
        const prompt = `
            Create a compelling professional summary for this candidate applying to ${jobAnalysis.positionTitle} at ${jobAnalysis.companyName}.
            
            Candidate Background:
            - Current Summary: ${resumeData.generatedSummary}
            - Experience: ${resumeData.experience.map(e => `${e.role} at ${e.company}`).join(', ')}
            - Skills: ${resumeData.competencies.map(c => c.skills.join(', ')).join(', ')}
            
            Job Requirements: ${jobAnalysis.extractedRequirements.join(', ')}
            Company Culture: ${jobAnalysis.cultureIndicators.join(', ')}
            
            Write a 3-4 sentence professional summary that:
            1. Positions the candidate as ideal for THIS specific role
            2. Uses language from the job posting naturally
            3. Highlights most relevant experience
            4. Remains authentic (don't fabricate)
            
            Return ONLY the summary text, no JSON, no markdown.
        `;

        const summary = await generateGenericText(prompt, configOverride);
        return { data: summary };
    } catch (e: any) {
        console.error("Summary generation error:", e);
        return { error: e.message || "Failed to generate summary" };
    }
}

/**
 * Reframe a specific experience bullet point for the target role
 */
export async function generateReframedExperience(
    originalBullet: string,
    context: { role: string; company: string },
    jobAnalysis: JobAnalysis,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: string; error?: string }> {
    try {
        const prompt = `
            Reframe this experience bullet point to better align with a ${jobAnalysis.positionTitle} role at ${jobAnalysis.companyName}.
            
            Original Context: ${context.role} at ${context.company}
            Original Bullet: "${originalBullet}"
            
            Target Role Requirements: ${jobAnalysis.extractedRequirements.slice(0, 5).join(', ')}
            Target Skills: ${jobAnalysis.extractedSkills.slice(0, 8).join(', ')}
            
            Rewrite this bullet to:
            1. Emphasize aspects most relevant to the target role
            2. Use keywords from the job posting naturally
            3. Maintain the same core achievement (be authentic)
            4. Follow the "Action Verb + Task + Quantifiable Result" formula
            
            Return ONLY the rewritten bullet point, no JSON, no markdown, no quotes.
        `;

        const reframed = await generateGenericText(prompt, configOverride);
        return { data: reframed.trim() };
    } catch (e: any) {
        console.error("Reframing error:", e);
        return { error: e.message || "Failed to reframe experience" };
    }
}

/**
 * Save a tailored resume version to the database
 */
export async function saveTailoredVersion(
    version: Omit<TailoredResumeVersion, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<{ data?: { id: string }; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Must be authenticated to save tailored version" };
        }

        const { data, error } = await supabase
            .from('tailored_resumes')
            .insert({
                user_id: user.id,
                job_analysis_id: version.jobAnalysisId,
                version_name: version.versionName,
                original_summary: version.originalSummary,
                original_experience: version.originalExperience,
                original_competencies: version.originalCompetencies,
                tailored_summary: version.tailoredSummary,
                tailored_experience: version.tailoredExperience,
                tailored_competencies: version.tailoredCompetencies,
                recommendations: version.recommendations,
                company_name: version.companyName,
                position_title: version.positionTitle,
                applied_at: version.appliedAt
            })
            .select('id')
            .single();

        if (error) {
            console.error("Database error saving tailored version:", error);
            return { error: "Failed to save tailored version" };
        }

        return { data: { id: data.id } };
    } catch (e: any) {
        console.error("Save tailored version error:", e);
        return { error: e.message || "Failed to save tailored version" };
    }
}

/**
 * Fetch all tailored resume versions for the current user
 */
export async function fetchTailoredVersions(): Promise<{ data?: TailoredResumeVersion[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: [] };
        }

        const { data, error } = await supabase
            .from('tailored_resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Database error fetching versions:", error);
            return { error: "Failed to fetch tailored versions" };
        }

        const versions: TailoredResumeVersion[] = (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            jobAnalysisId: row.job_analysis_id,
            versionName: row.version_name,
            originalSummary: row.original_summary,
            originalExperience: row.original_experience,
            originalCompetencies: row.original_competencies,
            tailoredSummary: row.tailored_summary,
            tailoredExperience: row.tailored_experience,
            tailoredCompetencies: row.tailored_competencies,
            recommendations: row.recommendations,
            companyName: row.company_name,
            positionTitle: row.position_title,
            appliedAt: row.applied_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        return { data: versions };
    } catch (e: any) {
        console.error("Fetch tailored versions error:", e);
        return { error: e.message || "Failed to fetch tailored versions" };
    }
}

/**
 * Delete a tailored resume version
 */
export async function deleteTailoredVersion(versionId: string): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Must be authenticated" };
        }

        const { error } = await supabase
            .from('tailored_resumes')
            .delete()
            .eq('id', versionId)
            .eq('user_id', user.id);

        if (error) {
            console.error("Database error deleting version:", error);
            return { error: "Failed to delete version" };
        }

        // Revalidate the page to update the list
        try {
            const { revalidatePath } = await import("next/cache");
            revalidatePath("/resume-tailor");
        } catch (e) {
            console.error("Revalidation error:", e);
        }

        return {};
    } catch (e: any) {
        console.error("Delete version error:", e);
        return { error: e.message || "Failed to delete version" };
    }
}
