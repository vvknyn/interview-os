"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAppConfig() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("app_config")
        .select("*")
        .eq("id", 1)
        .single();

    if (error) {
        console.error("[Admin] Failed to fetch app config:", error);
        return { data: null, error: error.message };
    }

    return { data };
}

export async function updateAppConfig(updates: {
    show_donation?: boolean;
    donation_url?: string;
}) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("app_config")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

    if (error) {
        console.error("[Admin] Failed to update app config:", error);
        return { error: error.message };
    }

    return { success: true };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (error || !data) return false;

    return data.is_admin === true;
}
