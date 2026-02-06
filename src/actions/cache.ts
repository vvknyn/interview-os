/**
 * Server actions for interview prep cache management
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { CachedInterviewData } from "@/lib/interview-cache";

const CACHE_DURATION_HOURS = 24;

export interface ServerCachedData {
    id: string;
    cacheKey: string;
    company: string;
    position: string;
    round: string;
    reconData?: any;
    matchData?: any;
    questionsData?: any;
    reverseData?: any;
    technicalData?: any;
    codingChallenge?: any;
    systemDesignData?: any;
    resumeCompanies?: string[];
    hasResumeContext: boolean;
    createdAt: string;
    expiresAt: string;
}

/**
 * Fetch cached data from server
 */
export async function fetchServerCache(cacheKey: string): Promise<{ data?: CachedInterviewData; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("interview_prep_cache")
            .select("*")
            .eq("user_id", user.id)
            .eq("cache_key", cacheKey)
            .gt("expires_at", new Date().toISOString()) // Only non-expired
            .single();

        if (error) {
            console.log("[ServerCache] Cache miss or error:", error.message);
            return { data: undefined };
        }

        if (!data) {
            console.log("[ServerCache] No cache entry found");
            return { data: undefined };
        }

        console.log("[ServerCache] Cache hit:", cacheKey);

        return {
            data: {
                cacheKey: data.cache_key,
                company: data.company,
                position: data.position,
                round: data.round,
                hasResumeContext: data.has_resume_context,
                createdAt: new Date(data.created_at).getTime(),
                expiresAt: new Date(data.expires_at).getTime(),
                reconData: data.recon_data,
                matchData: data.match_data,
                questionsData: data.questions_data,
                reverseData: data.reverse_data,
                technicalData: data.technical_data,
                codingChallenge: data.coding_challenge,
                systemDesignData: data.system_design_data,
                resumeCompanies: data.resume_companies || []
            }
        };
    } catch (e: any) {
        console.error("[ServerCache] Fetch error:", e);
        return { error: e.message };
    }
}

/**
 * Save data to server cache
 */
export async function saveServerCache(cachedData: CachedInterviewData): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);

        const { error } = await supabase
            .from("interview_prep_cache")
            .upsert({
                user_id: user.id,
                cache_key: cachedData.cacheKey,
                company: cachedData.company,
                position: cachedData.position,
                round: cachedData.round,
                recon_data: cachedData.reconData,
                match_data: cachedData.matchData,
                questions_data: cachedData.questionsData,
                reverse_data: cachedData.reverseData,
                technical_data: cachedData.technicalData,
                coding_challenge: cachedData.codingChallenge,
                system_design_data: cachedData.systemDesignData,
                resume_companies: cachedData.resumeCompanies || [],
                has_resume_context: cachedData.hasResumeContext,
                expires_at: expiresAt.toISOString()
            }, {
                onConflict: "user_id,cache_key"
            });

        if (error) {
            console.error("[ServerCache] Save error:", error);
            return { error: error.message };
        }

        console.log("[ServerCache] Data saved:", cachedData.cacheKey, "expires:", expiresAt);
        return {};
    } catch (e: any) {
        console.error("[ServerCache] Save exception:", e);
        return { error: e.message };
    }
}

/**
 * Clear specific cache entry
 */
export async function clearServerCache(cacheKey: string): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("interview_prep_cache")
            .delete()
            .eq("user_id", user.id)
            .eq("cache_key", cacheKey);

        if (error) {
            console.error("[ServerCache] Clear error:", error);
            return { error: error.message };
        }

        console.log("[ServerCache] Cleared:", cacheKey);
        return {};
    } catch (e: any) {
        console.error("[ServerCache] Clear exception:", e);
        return { error: e.message };
    }
}

/**
 * Clear all cache entries for current user
 */
export async function clearAllServerCache(): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("interview_prep_cache")
            .delete()
            .eq("user_id", user.id);

        if (error) {
            console.error("[ServerCache] Clear all error:", error);
            return { error: error.message };
        }

        console.log("[ServerCache] Cleared all cache for user");
        return {};
    } catch (e: any) {
        console.error("[ServerCache] Clear all exception:", e);
        return { error: e.message };
    }
}

/**
 * Clean up expired cache entries (can be called periodically)
 */
export async function cleanupExpiredCache(): Promise<{ deleted?: number; error?: string }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.rpc('cleanup_expired_cache');

        if (error) {
            console.error("[ServerCache] Cleanup error:", error);
            return { error: error.message };
        }

        console.log("[ServerCache] Expired entries cleaned up");
        return {};
    } catch (e: any) {
        console.error("[ServerCache] Cleanup exception:", e);
        return { error: e.message };
    }
}
