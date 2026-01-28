"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchProfile() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("resume_text, custom_api_key, preferred_model")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("[Profile] Fetch Error:", error);
            // Don't error out, just return null so we can fall back to default if needed
            return { data: null };
        }

        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateResume(resumeText: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        console.log("[Profile] Updating resume for:", user.id);

        const { error } = await supabase
            .from("profiles")
            .update({ resume_text: resumeText })
            .eq("id", user.id);

        if (error) {
            console.error("[Profile] Update Error:", error);
            return { error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateModelSettings(apiKey: string, model: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        console.log("[Profile] Updating model settings for:", user.id);

        const { error } = await supabase
            .from("profiles")
            .update({
                custom_api_key: apiKey,
                preferred_model: model
            })
            .eq("id", user.id);

        if (error) {
            console.error("[Profile] Settings Update Error:", error);
            return { error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
