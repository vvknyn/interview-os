import { supabase } from './supabase';

export interface Story {
    id: string;
    created_at: string;
    title: string;
    content: string;
    user_id?: string;
}

export async function getStories(): Promise<Story[]> {
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
