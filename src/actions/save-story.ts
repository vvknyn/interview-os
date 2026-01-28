"use server";

import { createClient } from "@/lib/supabase/server";
import { StarStory } from "@/types";

export async function saveStories(stories: StarStory[]) {
    if (!stories || !Array.isArray(stories)) return { error: "Invalid stories data" };

    try {
        const supabase = await createClient();
        console.log("[Server Action] Saving stories individually...", stories.length);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        const rowsToInsert = stories.map(story => ({
            title: story.title,
            // We store the full object in content to preserve all fields including ID and deleted status
            content: JSON.stringify(story),
            user_id: user.id
        }));

        const { data, error } = await supabase
            .from('stories')
            .insert(rowsToInsert)
            .select();

        if (error) {
            console.error("[Supabase Error]", error);
            return { error: error.message };
        }

        console.log("[Server Action] Saved rows:", data?.length);
        return { success: true, data };

    } catch (e: unknown) {
        console.error("[Server Action] Unexpected Error in saveStories:", e);
        return { error: (e as Error).message };
    }
}

export async function fetchStories() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        // Fetch stories for the current user
        const { data, error } = await supabase
            .from('stories')
            .select('id, content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }); // Oldest first, so newer overwrites older

        if (error) {
            console.error("[Supabase Error]", error);
            return { error: error.message };
        }

        if (!data) {
            console.log("[Server Action] No data returned from fetchStories");
            return { data: "[]" };
        }

        console.log(`[Server Action] Fetched ${data.length} rows.`);

        const storyMap = new Map<string, StarStory>();

        data.forEach(row => {
            if (!row.content) {
                console.warn("[Server Action] Row missing content:", row);
                return;
            }
            try {
                const parsed = JSON.parse(row.content);

                // Handle legacy format (array of stories)
                if (Array.isArray(parsed)) {
                    // console.log(`[Server Action] Found legacy array in row created at ${row.created_at}, size: ${parsed.length}`);
                    parsed.forEach((s: StarStory) => {
                        if (s.id) {
                            storyMap.set(s.id, s);
                        } else {
                            console.warn("Legacy story missing ID:", s);
                        }
                    });
                }
                // Handle new format (single story object)
                else if (parsed.id) {
                    storyMap.set(parsed.id, parsed);
                } else {
                    console.warn("[Server Action] Parsed object missing ID:", parsed);
                }
            } catch (e) {
                // If JSON parsing fails, treat it as legacy text content and wrap it in a partial story
                // This ensures we don't lose data like "--- PRE-LOADED STAR STORIES ---"
                if (row.content && typeof row.content === 'string' && row.content.trim().length > 0) {
                    const fallbackId = row.id;
                    // Only add if we haven't seen this ID (unlikely to collide as it's a UUID)
                    // or if we want to preserve this specific row as a story
                    if (!storyMap.has(fallbackId)) {
                        // Advanced Legacy Parsing: Try to split by "Q:" and "A:"
                        // Format appears to be: Q: Question \n A: Answer \n\n
                        const rawText = row.content;
                        const qaRegex = /Q:\s*(.*?)\s*\n\s*A:\s*([\s\S]*?)(?=\n\s*Q:|$)/g;
                        let match;
                        let index = 0;
                        let foundMatches = false;

                        while ((match = qaRegex.exec(rawText)) !== null) {
                            foundMatches = true;
                            const question = match[1].trim();
                            const answer = match[2].trim();
                            const generatedId = `${fallbackId}-${index}`;

                            storyMap.set(generatedId, {
                                id: generatedId,
                                title: question.length > 50 ? question.substring(0, 50) + "..." : question,
                                situation: `Question: ${question}\n\nAnswer: ${answer}`,
                                task: "",
                                action: "",
                                result: "",
                            });
                            index++;
                        }

                        // Fallback to single blob if no Q/A structure found but text exists
                        if (!foundMatches) {
                            storyMap.set(fallbackId, {
                                id: fallbackId,
                                title: "Restored Legacy Content",
                                situation: row.content,
                                task: "Please refactor this content into the appropriate fields.",
                                action: "",
                                result: "",
                            });
                        }
                        console.log(`[Server Action] Recovered ${index} legacy stories from row ${row.id}`);
                    }
                } else {
                    console.warn("[Server Action] Failed to parse story row:", row.content?.substring(0, 50) + "...", e);
                }
            }
        });

        console.log(`[Server Action] Processed ${storyMap.size} unique stories.`);

        // Convert map to array and filter out deleted ones
        const validStories = Array.from(storyMap.values()).filter(s => !s.deleted);

        return { data: JSON.stringify(validStories) };

    } catch (e: unknown) {
        console.error("[Server Action] Unexpected Error in fetchStories:", e);
        return { error: (e as Error).message };
    }
}
