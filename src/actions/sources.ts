"use server";

import { createClient } from "@/lib/supabase/server";
import { SourceItem } from "@/types";
import { checkContentSafety, checkContentSafetyStrict } from "@/lib/url-safety";
import { fetchUrlContent as fetchUrlCore, discoverLinks as discoverLinksCore } from "@/actions/fetch-url";

export async function fetchSources(): Promise<{ data?: SourceItem[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("sources")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data: data as SourceItem[] };
    } catch (e: unknown) {
        console.error("Fetch Sources Error:", e);
        return { error: (e as Error).message || "Failed to fetch sources." };
    }
}

export async function saveSource(source: Omit<SourceItem, 'id' | 'created_at' | 'user_id'>): Promise<{ data?: SourceItem; error?: string }> {
    try {
        const supabase = await createClient();

        // Normalize newlines in content to prevent issues
        const content = source.content.replace(/\r\n/g, '\n');

        // Content safety check - strict for public sources
        const visibility = source.visibility || 'private';
        if (visibility === 'public') {
            const safetyCheck = checkContentSafetyStrict(content);
            if (!safetyCheck.safe) return { error: safetyCheck.reason };
        } else {
            const safetyCheck = checkContentSafety(content);
            if (!safetyCheck.safe) return { error: safetyCheck.reason };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        const { data, error } = await supabase
            .from("sources")
            .insert([{ ...source, content, visibility, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return { data: data as SourceItem };
    } catch (e: unknown) {
        console.error("Save Source Error:", e);
        return { error: (e as Error).message || "Failed to save source." };
    }
}

export async function deleteSource(id: string): Promise<{ error?: string }> {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from("sources")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return {};
    } catch (e: unknown) {
        console.error("Delete Source Error:", e);
        return { error: (e as Error).message || "Failed to delete source." };
    }
}

export async function fetchUrlContent(url: string): Promise<{ text?: string; title?: string; error?: string }> {
    const { data, title, error } = await fetchUrlCore(url);
    return { text: data, title, error };
}

export async function discoverLinks(url: string): Promise<{ links: { url: string; title: string }[]; error?: string }> {
    return discoverLinksCore(url);
}

export async function fetchPublicSources(search?: string): Promise<{ data?: Omit<SourceItem, 'user_id'>[]; error?: string }> {
    try {
        const supabase = await createClient();
        let query = supabase
            .from("sources")
            .select("id, type, title, content, created_at, visibility")
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .limit(50);

        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            query = query.or(`title.ilike.${term},content.ilike.${term}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data: data as Omit<SourceItem, 'user_id'>[] };
    } catch (e: unknown) {
        console.error("Fetch Public Sources Error:", e);
        return { error: (e as Error).message || "Failed to fetch public sources." };
    }
}

export async function addPublicSourceToCollection(sourceId: string): Promise<{ data?: SourceItem; error?: string }> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        // Fetch the public source
        const { data: publicSource, error: fetchError } = await supabase
            .from("sources")
            .select("*")
            .eq("id", sourceId)
            .eq("visibility", "public")
            .single();

        if (fetchError || !publicSource) return { error: "Source not found or not public" };

        // Copy as a private source for this user
        const { data, error } = await supabase
            .from("sources")
            .insert([{
                type: publicSource.type,
                title: publicSource.title,
                content: publicSource.content,
                visibility: 'private',
                user_id: user.id,
            }])
            .select()
            .single();

        if (error) throw error;
        return { data: data as SourceItem };
    } catch (e: unknown) {
        console.error("Add Public Source Error:", e);
        return { error: (e as Error).message || "Failed to add source." };
    }
}
