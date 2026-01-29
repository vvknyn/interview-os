"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarStory, SourceItem } from "@/types";
import { StoryManager } from "@/components/dashboard/StoryManager";
import { saveStories, fetchStories } from "@/actions/save-story";
import { fetchProfile, updateResume, updateModelSettings } from "@/actions/profile";
import { fetchSources } from "@/actions/sources";
import { SourcesManager } from "@/components/settings/SourcesManager";
import { ModelSettings, AVAILABLE_MODELS } from "@/components/settings/ModelSettings";
import { ArrowLeft, FloppyDisk } from "@phosphor-icons/react";
import Link from "next/link";

export function SettingsContainer() {
    const [resume, setResume] = useState("");
    const [stories, setStories] = useState<StarStory[]>([]);
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState(AVAILABLE_MODELS.groq[0].id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'resume' | 'stories' | 'sources' | 'models'>('stories');
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

                // Fetch Profile (Resume & Settings)
                const { data: profileData } = await fetchProfile();
                if (profileData) {
                    if (profileData.resume_text) setResume(profileData.resume_text);
                    if (profileData.custom_api_key) setApiKey(profileData.custom_api_key);
                    if (profileData.preferred_model) setModel(profileData.preferred_model);
                } else {
                    // Guest mode: Load from localStorage
                    const guestKey = localStorage.getItem('guest_api_key');
                    const guestModel = localStorage.getItem('guest_model');

                    if (guestKey) setApiKey(guestKey);
                    if (guestModel) setModel(guestModel);
                }

                // Fetch Sources
                const { data: sourcesData } = await fetchSources();
                if (sourcesData) {
                    setSources(sourcesData);
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
            // Persist Stories
            if (stories) {
                const res = await saveStories(stories);
                if (res.error) throw new Error(res.error);
            }

            // Persist Resume
            if (activeTab === 'resume' || true) { // Always save resume if potentially modified
                const res = await updateResume(resume);
                if (res.error) throw new Error(res.error);
            }

            // Persist Model Settings (only if on models tab or implicitly)
            // It's safer to save settings when explicitly asked via the ModelSettings component, 
            // but we can also save here if we want a global save button.
            // For now, let's allow ModelSettings to handle its own save or we hook it up here.
            // Actually, the ModelSettings component has its own "Save" button in the UI I designed.
            // But this global save button is in the header. Let's make it universal.
            const modelRes = await updateModelSettings(apiKey, model);
            if (modelRes.error) throw new Error(modelRes.error);

            setMessage({ type: 'success', text: 'Settings saved successfully.' });
            setTimeout(() => setMessage(null), 3000);

        } catch (e: unknown) {
            const error = e as Error;
            setMessage({ type: 'error', text: error.message || "Failed to save settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleModelSave = async (key: string, mod: string) => {
        setApiKey(key);
        setModel(mod);
        // Also trigger save immediately
        setIsSaving(true);
        try {
            const res = await updateModelSettings(key, mod);

            if (res.error && res.error === "Unauthorized") {
                // Guest mode fallback: save to localStorage
                localStorage.setItem('guest_api_key', key);
                localStorage.setItem('guest_model', mod);
                setMessage({ type: 'success', text: 'Settings saved locally (guest mode).' });
            } else if (res.error) {
                throw new Error(res.error);
            } else {
                setMessage({ type: 'success', text: 'Model settings saved.' });
            }

            setTimeout(() => setMessage(null), 3000);
        } catch (e: unknown) {
            const error = e as Error;
            setMessage({ type: 'error', text: error.message || "Failed to save model settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            setResume(text);
            setMessage({ type: 'success', text: 'File imported successfully.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to read file.' });
        }

        // Clear the input so the same file can be selected again
        e.target.value = '';
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
                            Save All
                        </>
                    )}
                </Button>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6">
                {/* Tabs */}
                <div className="flex gap-6 border-b border-border mb-8 overflow-x-auto">
                    {['stories', 'resume', 'sources', 'models'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`pb-3 text-sm font-medium transition-colors border-b-2 capitalize ${activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab}
                        </button>
                    ))}
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
                                Import Text File
                                <input type="file" className="hidden" accept=".txt,.md" onChange={handleFileUpload} />
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

                {activeTab === 'sources' && (
                    <div className="animate-in fade-in duration-300">
                        <p className="text-sm text-muted-foreground mb-6">External context for generating company-specific answers</p>
                        {isLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                                <p className="text-sm">Loading sources...</p>
                            </div>
                        ) : (
                            <SourcesManager sources={sources} onChange={setSources} />
                        )}
                    </div>
                )}

                {activeTab === 'models' && (
                    <div className="animate-in fade-in duration-300">
                        {isLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                                <p className="text-sm">Loading settings...</p>
                            </div>
                        ) : (
                            <ModelSettings
                                apiKey={apiKey}
                                model={model}
                                onSave={handleModelSave}
                                loading={isSaving}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
