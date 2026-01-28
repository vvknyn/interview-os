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

export async function fetchUrlContent(url: string): Promise<{ text?: string; title?: string; error?: string }> {
    try {
        // Basic fetch implementation
        // In a production env, this might need a headless browser or proxy due to CORS/blocking
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; InterviewPrepBot/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();

        // Very basic extraction - extracting body text
        // Ideally we'd use dompurify, cheerio or similar
        // For now, regex to strip tags
        const text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
            .replace(/<[^>]+>/g, "\n")
            .replace(/\n\s*\n/g, "\n")
            .trim();

        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : url;

        return { text: text.substring(0, 10000), title }; // Limit to 10k chars
    } catch (e: unknown) {
        console.error("URL Fetch Error:", e);
        return { error: (e as Error).message || "Failed to fetch URL content." };
    }
}
