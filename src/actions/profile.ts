"use server";

import { createClient } from "@/lib/supabase/server";

export interface ProviderApiKeys {
    groq?: string;
    gemini?: string;
    openai?: string;
}

export async function fetchProfile() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("resume_text, custom_api_key, preferred_model, provider_api_keys")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("[Profile] Fetch Error:", error);
            // Don't error out, just return null so we can fall back to default if needed
            return { data: null };
        }

        // Prefer provider_api_keys (JSONB) over custom_api_key (TEXT)
        // For backward compatibility, merge both if needed
        if (data) {
            const apiKeys = data.provider_api_keys || {};
            // If provider_api_keys is empty but custom_api_key has data, use that
            if (Object.keys(apiKeys).length === 0 && data.custom_api_key) {
                try {
                    const parsed = JSON.parse(data.custom_api_key);
                    data.provider_api_keys = parsed;
                } catch {
                    // custom_api_key isn't valid JSON, ignore
                }
            }
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

        // Parse the apiKey if it's JSON (new format with multiple providers)
        let providerApiKeys: ProviderApiKeys = {};
        try {
            providerApiKeys = JSON.parse(apiKey);
        } catch {
            // Not JSON, might be a single key - we'll keep custom_api_key for backward compat
        }

        const updateData: Record<string, unknown> = {
            preferred_model: model
        };

        // If we have parsed provider keys, save to JSONB column
        if (Object.keys(providerApiKeys).length > 0) {
            updateData.provider_api_keys = providerApiKeys;
            updateData.custom_api_key = apiKey; // Keep backup in TEXT column
        } else {
            updateData.custom_api_key = apiKey;
        }

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
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

/**
 * Save API keys for all providers
 */
export async function saveProviderApiKeys(keys: ProviderApiKeys) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        console.log("[Profile] Saving provider API keys for:", user.id);

        const { error } = await supabase
            .from("profiles")
            .update({
                provider_api_keys: keys,
                custom_api_key: JSON.stringify(keys) // Backup in TEXT column
            })
            .eq("id", user.id);

        if (error) {
            console.error("[Profile] API Keys Save Error:", error);
            return { error: error.message };
        }

        console.log("[Profile] API keys saved successfully");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

/**
 * Load API keys for all providers
 */
export async function loadProviderApiKeys(): Promise<{ data?: ProviderApiKeys; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("provider_api_keys, custom_api_key")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("[Profile] API Keys Load Error:", error);
            return { error: error.message };
        }

        // Prefer JSONB column, fallback to TEXT column
        if (data?.provider_api_keys && Object.keys(data.provider_api_keys).length > 0) {
            return { data: data.provider_api_keys };
        }

        if (data?.custom_api_key) {
            try {
                return { data: JSON.parse(data.custom_api_key) };
            } catch {
                return { data: {} };
            }
        }

        return { data: {} };
    } catch (e: any) {
        return { error: e.message };
    }
}
