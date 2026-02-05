"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { StoryManager } from "@/components/dashboard/StoryManager";
import { fetchStories, saveStories } from "@/actions/save-story";
import { fetchProfile, updateModelSettings } from "@/actions/profile";
import { fetchSources } from "@/actions/sources";
import { SourcesManager } from "@/components/settings/SourcesManager";
import { ModelSettings, AVAILABLE_MODELS } from "@/components/settings/ModelSettings";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { NavMenu } from "@/components/layout/NavMenu";
import { AuthPopover } from "@/components/auth/auth-popover";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { StarStory, SourceItem } from "@/types";

export function SettingsContainer() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [authPopoverOpen, setAuthPopoverOpen] = useState(false);

    const [stories, setStories] = useState<StarStory[]>([]);
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState(AVAILABLE_MODELS.groq[0].id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'stories' | 'sources' | 'models'>('stories');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            // Fetch User
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

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

                // Fetch Profile (Settings)
                const { data: profileData } = await fetchProfile();
                if (profileData) {
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

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border px-4 py-4 flex items-center gap-3">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={20} weight="regular" />
                </Link>
                <h1 className="text-lg font-semibold">Settings</h1>
                <div className="ml-auto flex items-center gap-2">
                    <NavMenu
                        user={user}
                        onSignInClick={() => setAuthPopoverOpen(true)}
                        onSignOut={handleSignOut}
                    />
                    <AuthPopover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen} showTrigger={false} />
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6">
                {/* Tabs */}
                <div className="flex gap-6 border-b border-border mb-8 overflow-x-auto">
                    {['stories', 'sources', 'models'].map((tab) => (
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

                {activeTab === 'stories' && (
                    <div className="animate-in fade-in duration-300">
                        <p className="text-sm text-muted-foreground mb-6">Your library of experiences for behavioral questions</p>

                        {isLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                                <p className="text-sm">Loading stories...</p>
                            </div>
                        ) : (
                            <StoryManager
                                stories={stories}
                                onChange={async (newStories) => {
                                    setStories(newStories);
                                    setIsSaving(true);
                                    try {
                                        const res = await saveStories(newStories);
                                        if (res.error) throw new Error(res.error);
                                    } catch (e: any) {
                                        setMessage({ type: 'error', text: e.message || "Failed to save stories." });
                                        // Revert on error? Or just notify?
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                            />
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
