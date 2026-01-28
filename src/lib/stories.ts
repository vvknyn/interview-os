import { createClient } from '@/lib/supabase/client';

export interface Story {
    id: string;
    created_at: string;
    title: string;
    content: string;
    user_id?: string;
    deleted?: boolean;
}

export async function getStories(): Promise<Story[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching stories:', error);
        return [];
    }

    return data || [];
}

export async function createStory(story: { title: string; content: string }) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('stories')
        .insert([story])
        .select();

    if (error) {
        console.error('Error creating story:', error);
        return null; // or throw
    }
    return data;
}
