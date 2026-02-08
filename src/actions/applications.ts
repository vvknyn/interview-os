"use server";

import { createClient } from "@/lib/supabase/server";
import { ApplicationDraft } from "@/components/applications/ApplicationWizard";

/**
 * Create a new application draft from the wizard state
 */
export async function createApplicationDraft(draft: ApplicationDraft): Promise<{ data?: { id: string }; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Must be authenticated to create application" };
        }

        // Validate minimal requirements
        if (!draft.jobAnalysis?.companyName || !draft.jobAnalysis?.positionTitle) {
            return { error: "Company name and position are required" };
        }

        // Insert into applications table
        const { data, error } = await supabase
            .from('applications')
            .insert({
                user_id: user.id,
                company_name: draft.jobAnalysis.companyName,
                position: draft.jobAnalysis.positionTitle,
                job_url: draft.jobUrl || null,
                // job_description: draft.jobText || null, // Ensure migration 20260207010000 is applied before uncommenting
                status: 'applied',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error("Failed to create application draft:", error);
            return { error: error.message };
        }

        return { data: { id: data.id } };
    } catch (e: any) {
        console.error("Create application draft error:", e);
        return { error: e.message || "Failed to create application draft" };
    }
}

/**
 * Fetch a single application by ID
 */
export async function fetchApplicationById(id: string): Promise<{ data?: any; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Unauthorized" };

        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        return { data };
    } catch (e: any) {
        console.error("Fetch application error:", e);
        return { error: e.message };
    }
}

/**
 * Update an application with the linked resume version
 */
export async function linkResumeVersionToApplication(
    applicationId: string,
    resumeVersionId: string
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Unauthorized" };

        const { error } = await supabase
            .from('applications')
            .update({
                resume_version_id: resumeVersionId,
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .eq('user_id', user.id);

        if (error) throw error;
        return {};
    } catch (e: any) {
        console.error("Link resume version error:", e);
        return { error: e.message };
    }
}
