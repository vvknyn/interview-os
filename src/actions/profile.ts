"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptKeys, decryptKeys } from "@/lib/encryption";

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

        // Only select columns that exist in all schemas
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

        // Parse custom_api_key if it's JSON (contains provider keys)
        if (data && data.custom_api_key) {
            try {
                const parsed = JSON.parse(data.custom_api_key);
                // If it's a valid JSON object with provider keys, attach it
                if (parsed && typeof parsed === 'object') {
                    (data as any).provider_api_keys = parsed;
                }
            } catch {
                // Not JSON, that's okay - it's a legacy single key
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

        // Simply save to custom_api_key (works for both JSON and plain text)
        const updateData: Record<string, unknown> = {
            preferred_model: model,
            custom_api_key: apiKey
        };

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

        if (error) {
            console.error("[Profile] Settings Update Error:", error);
            return { error: error.message };
        }

        // Revalidate cache to ensure new settings take effect everywhere
        try {
            const { revalidatePath } = await import("next/cache");
            revalidatePath("/", "layout");
        } catch (e) {
            console.warn("Failed to revalidate cache:", e);
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

/**
 * Save API keys for all providers.
 * Encrypts key values before storing (provider names stay plaintext).
 */
export async function saveProviderApiKeys(keys: ProviderApiKeys) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        console.log("[Profile] Saving provider API keys for:", user.id);

        // Encrypt API key values before storing
        const encryptedKeys = encryptKeys(keys as Record<string, string | undefined>);

        const { error } = await supabase
            .from("profiles")
            .update({
                custom_api_key: JSON.stringify(encryptedKeys)
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
            .select("custom_api_key")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("[Profile] API Keys Load Error:", error);
            return { error: error.message };
        }

        // Parse custom_api_key if it's JSON, then decrypt values
        if (data?.custom_api_key) {
            try {
                const parsed = JSON.parse(data.custom_api_key);
                if (parsed && typeof parsed === 'object') {
                    // Decrypt API key values (handles both encrypted and plaintext for backwards compat)
                    const decrypted = decryptKeys(parsed);
                    return { data: decrypted as ProviderApiKeys };
                }
            } catch {
                // Not JSON, return empty
            }
        }

        return { data: {} };
    } catch (e: any) {
        return { error: e.message };
    }
}
