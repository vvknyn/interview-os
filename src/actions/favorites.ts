"use server";

import { createClient } from "@/lib/supabase/server";

export interface FavoriteQuestion {
    id: string;
    user_id: string;
    question_text: string;
    question_category?: string;
    company?: string;
    position?: string;
    round?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateFavoriteInput {
    question_text: string;
    question_category?: string;
    company?: string;
    position?: string;
    round?: string;
    notes?: string;
}

/**
 * Fetch all favorite questions for the current user
 */
export async function fetchFavorites() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("favorite_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching favorites:", error);
        return { data: null, error: error.message };
    }

    return { data: data as FavoriteQuestion[], error: null };
}

/**
 * Add a question to favorites
 */
export async function addFavorite(input: CreateFavoriteInput) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("favorite_questions")
        .insert({
            user_id: user.id,
            ...input
        })
        .select()
        .single();

    if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === "23505") {
            return { data: null, error: "Question already in favorites" };
        }
        console.error("Error adding favorite:", error);
        return { data: null, error: error.message };
    }

    return { data: data as FavoriteQuestion, error: null };
}

/**
 * Remove a question from favorites
 */
export async function removeFavorite(favoriteId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("favorite_questions")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error removing favorite:", error);
        return { error: error.message };
    }

    return { error: null };
}

/**
 * Update notes for a favorite question
 */
export async function updateFavoriteNotes(favoriteId: string, notes: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("favorite_questions")
        .update({
            notes,
            updated_at: new Date().toISOString()
        })
        .eq("id", favoriteId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating favorite notes:", error);
        return { error: error.message };
    }

    return { error: null };
}

/**
 * Check if a question is favorited
 */
export async function isFavorited(questionText: string, company?: string, position?: string, round?: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { data: false, error: "Unauthorized" };
    }

    let query = supabase
        .from("favorite_questions")
        .select("id")
        .eq("user_id", user.id)
        .eq("question_text", questionText);

    if (company) query = query.eq("company", company);
    if (position) query = query.eq("position", position);
    if (round) query = query.eq("round", round);

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") { // PGRST116 = not found
        console.error("Error checking favorite status:", error);
        return { data: false, error: error.message };
    }

    return { data: !!data, error: null };
}
