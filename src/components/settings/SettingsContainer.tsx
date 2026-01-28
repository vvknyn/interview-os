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
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={20} weight="regular" />
                    </Link>
                    <h1 className="text-lg font-semibold">Settings</h1>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-foreground text-background hover:bg-foreground/90 h-9 px-4 text-sm font-medium"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border border-background border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <FloppyDisk size={16} weight="regular" className="mr-2" />
                            Save
                        </>
                    )}
                </Button>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                {/* Tabs */}
                <div className="flex gap-6 border-b border-border mb-8">
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'resume' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Resume
                    </button>
                    <button
                        onClick={() => setActiveTab('stories')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'stories' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Stories
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-muted text-foreground border border-border' : 'bg-destructive/5 text-destructive border border-destructive/20'}`}>
                        {message.text}
                    </div>
                )}

                {activeTab === 'resume' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-muted-foreground">Paste your resume to tailor answers</p>
                            <label className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-2 transition-colors">
                                Upload PDF
                                <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <Textarea
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                            className="w-full h-[600px] p-4 text-sm font-mono bg-transparent border-border focus-visible:border-foreground transition-colors resize-none"
                            placeholder="Paste your resume here..."
                        />
                    </div>
                )}

                {activeTab === 'stories' && (
                    <div className="animate-in fade-in duration-300">
                        <p className="text-sm text-muted-foreground mb-6">Your library of experiences for behavioral questions</p>

                        {isLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                                <p className="text-sm">Loading stories...</p>
                            </div>
                        ) : (
                            <StoryManager stories={stories} onChange={setStories} />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
