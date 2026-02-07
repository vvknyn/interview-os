"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Delete the current user's account and all associated data.
 * Uses the admin client to call auth.admin.deleteUser().
 * CASCADE foreign keys ensure all data in stories, sources, applications,
 * tailored_resumes, job_analyses, favorite_questions, and interview_prep_cache
 * is automatically deleted.
 */
export async function deleteAccount(): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const adminClient = await createAdminClient();

        // Delete the auth user - CASCADE will handle all related data
        const { error } = await adminClient.auth.admin.deleteUser(user.id);

        if (error) {
            console.error("[Account] Delete error:", error);
            return { error: error.message };
        }

        // Sign out the current session
        await supabase.auth.signOut();

        return {};
    } catch (e: any) {
        console.error("[Account] Delete error:", e);
        return { error: e.message || "Failed to delete account" };
    }
}

/**
 * Export all user data as a JSON object.
 * Excludes provider_api_keys for security.
 */
export async function exportUserData(): Promise<{ data?: Record<string, any>; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        // Fetch all user data from every table in parallel
        const [
            profileResult,
            storiesResult,
            sourcesResult,
            applicationsResult,
            tailoredResumesResult,
            jobAnalysesResult,
            favoriteQuestionsResult,
            cacheResult,
        ] = await Promise.all([
            supabase
                .from("profiles")
                .select("id, username, resume_text, resume_data, resume_import_source, resume_import_confidence, resume_last_updated, preferred_model, created_at")
                .eq("id", user.id)
                .single(),
            supabase
                .from("stories")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("sources")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("applications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("tailored_resumes")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("job_analyses")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("favorite_questions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("interview_prep_cache")
                .select("*")
                .eq("user_id", user.id),
        ]);

        const exportData = {
            exported_at: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
            profile: profileResult.data || null,
            stories: storiesResult.data || [],
            sources: sourcesResult.data || [],
            applications: applicationsResult.data || [],
            tailored_resumes: tailoredResumesResult.data || [],
            job_analyses: jobAnalysesResult.data || [],
            favorite_questions: favoriteQuestionsResult.data || [],
            interview_prep_cache: cacheResult.data || [],
        };

        return { data: exportData };
    } catch (e: any) {
        console.error("[Account] Export error:", e);
        return { error: e.message || "Failed to export data" };
    }
}
