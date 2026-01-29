"use server";

import { createClient } from "@/lib/supabase/server";
import { SourceItem } from "@/types";

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

export async function saveSource(source: Omit<SourceItem, 'id' | 'created_at'>): Promise<{ data?: SourceItem; error?: string }> {
    try {
        const supabase = await createClient();

        // Normalize newlines in content to prevent issues
        const content = source.content.replace(/\r\n/g, '\n');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        const { data, error } = await supabase
            .from("sources")
            .insert([{ ...source, content, user_id: user.id }])
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

import { fetchUrlContent as fetchUrlCore } from "@/actions/fetch-url";

export async function fetchUrlContent(url: string): Promise<{ text?: string; title?: string; error?: string }> {
    const { data, title, error } = await fetchUrlCore(url);
    return { text: data, title, error };
}
