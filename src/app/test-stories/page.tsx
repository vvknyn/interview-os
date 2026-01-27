'use client';

import { useEffect, useState } from 'react';
import { getStories, Story } from '@/lib/stories';

export default function TestStoriesPage() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStories() {
            try {
                const data = await getStories();
                setStories(data);
            } catch (err) {
                setError('Failed to fetch stories check console');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStories();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

            {loading && <p>Loading stories...</p>}

            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && stories.length === 0 && (
                <p>No stories found. Connection seems successful, but table is empty.</p>
            )}

            {!loading && !error && stories.length > 0 && (
                <ul className="space-y-4 mb-8">
                    {stories.map((story) => (
                        <li key={story.id} className="border p-4 rounded bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-semibold">{story.title}</h3>
                            <p className="text-sm text-gray-500">{new Date(story.created_at).toLocaleDateString()}</p>
                            <p className="mt-2 text-black dark:text-gray-300">{story.content}</p>
                        </li>
                    ))}
                </ul>
            )}

            <div className="border-t pt-8">
                <h2 className="text-xl font-bold mb-4">Add New Story</h2>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                        const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;

                        // Dynamic import to avoid SSR issues if used elsewhere, though strictly not needed here since 'use client'
                        const { createStory } = await import('@/lib/stories');
                        if (title && content) {
                            await createStory({ title, content });
                            window.location.reload(); // Simple reload to refresh list
                        }
                    }}
                    className="space-y-4 max-w-md"
                >
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input name="title" required className="w-full border p-2 rounded text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        <textarea name="content" required className="w-full border p-2 rounded text-black" rows={4} />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Add Story
                    </button>
                </form>
            </div>
        </div>
    );
}
