"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStories(content: string | any) {
    if (!content) return { error: "Content is empty" };

    const finalContent = typeof content === 'string' ? content : JSON.stringify(content);

    try {
        console.log("[Server Action] Saving stories...");
        const supabase = await createClient();

        // We are using a single "User Stories" record for simplicity for this MVP.
        const { data, error } = await supabase
            .from('stories')
            .insert([
                {
                    title: 'My Stories',
                    content: finalContent
                }
            ])
            .select();

        if (error) {
            console.error("[Supabase Error]", error);
            return { error: error.message };
        }

        console.log("[Server Action] Saved:", data);
        return { success: true, data };
    } catch (e: any) {
        console.error("[Server Action] Unexpected Error in saveStories:", e);
        return { error: e.message };
    }
}

export async function fetchStories() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('stories')
            .select('content')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // It's fine if no rows exist, just return null
            if (error.code === 'PGRST116') return { data: null };
            console.error("[Supabase Error]", error);
            return { error: error.message };
        }

        return { data: data.content };
    } catch (e: any) {
        console.error("[Server Action] Unexpected Error:", e);
        return { error: e.message };
    }
}
