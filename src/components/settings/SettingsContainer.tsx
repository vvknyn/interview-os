"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarStory } from "@/types";
import { StoryManager } from "@/components/dashboard/StoryManager";
import { saveStories, fetchStories } from "@/actions/save-story";
import { fetchProfile, updateResume } from "@/actions/profile";
import { FilePdf, ArrowLeft, FloppyDisk } from "@phosphor-icons/react";
import Link from "next/link";

export function SettingsContainer() {
    const [resume, setResume] = useState("");
    const [stories, setStories] = useState<StarStory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'resume' | 'stories'>('stories');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch Stories
                const { data: storiesData } = await fetchStories();
                if (storiesData) {
                    try {
                        const parsed = JSON.parse(storiesData);
                        if (Array.isArray(parsed)) {
                            setStories(parsed);
                        }
                    } catch (e) {
                        console.warn("Legacy story format found, starting fresh.");
                    }
                }

                // Fetch Resume
                const { data: profileData } = await fetchProfile();
                if (profileData && profileData.resume_text) {
                    setResume(profileData.resume_text);
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Persist Stories to Supabase
            // Persist Stories
            if (stories) {
                const res = await saveStories(stories);
                if (res.error) throw new Error(res.error);
            }

            // Persist Resume
            if (activeTab === 'resume' || true) { // Always save resume if we have it
                const res = await updateResume(resume);
                if (res.error) throw new Error(res.error);
            }
            setMessage({ type: 'success', text: 'Settings saved successfully.' });
            setTimeout(() => setMessage(null), 3000);

        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || "Failed to save settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            alert("PDF extraction would happen here via API. Please paste text for now.");
        } else {
            const text = await file.text();
            setResume(text);
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border py-4 px-6 flex-none">
                <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-secondary">
                            <ArrowLeft size={20} weight="bold" />
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-none transition-all gap-2 px-6"
                    >
                        {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                            <FloppyDisk size={18} weight="fill" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:py-10 space-y-12 md:space-y-0 md:gap-12 flex flex-col md:flex-row items-start">

                {/* Left Sidebar Navigation */}
                <aside className="w-full md:w-56 flex-none sticky top-28 space-y-1">
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'resume' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                    >
                        Resume Context
                    </button>
                    <button
                        onClick={() => setActiveTab('stories')}
                        className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'stories' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                    >
                        STAR Stories
                    </button>
                </aside>

                {/* Right Content Area */}
                <section className="flex-1 min-w-0 w-full">
                    {message && (
                        <div className={`mb-8 p-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} animate-in slide-in-from-top-2`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'resume' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-end border-b border-border pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Resume Context</h2>
                                    <p className="text-muted-foreground text-sm">Paste your resume to tailor interview answers.</p>
                                </div>
                                <label className="cursor-pointer text-xs font-bold text-primary hover:text-primary/80 bg-secondary px-4 py-2 rounded-md transition-colors flex items-center gap-2">
                                    <FilePdf size={16} /> Upload PDF
                                    <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={handleFileUpload} />
                                </label>
                            </div>

                            <Textarea
                                value={resume}
                                onChange={(e) => setResume(e.target.value)}
                                className="w-full h-[600px] p-6 text-sm font-mono bg-card border-border rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all resize-y leading-relaxed"
                                placeholder="Paste your resume here..."
                            />
                        </div>
                    )}

                    {activeTab === 'stories' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="border-b border-border pb-4">
                                <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">STAR Stories</h2>
                                <p className="text-muted-foreground text-sm">Your library of experiences for behavioral questions.</p>
                            </div>

                            {isLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                                    <p className="text-sm font-medium">Loading stories...</p>
                                </div>
                            ) : (
                                <StoryManager stories={stories} onChange={setStories} />
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
