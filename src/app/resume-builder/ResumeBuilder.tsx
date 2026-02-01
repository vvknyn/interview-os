"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ResumeData } from "@/types/resume";
import { ResumeEditor } from "@/components/resume-builder/ResumeEditor";
import { ResumeImportModal } from "@/components/resume-builder/ResumeImportModal";
import { TailoredVersionsSidebar, TailoredVersionsToggle } from "@/components/resume-builder/TailoredVersionsSidebar";
import { ArrowLeft } from "@phosphor-icons/react";
import { fetchProfile } from "@/actions/profile";
import { fetchResumeData, saveResumeData } from "@/actions/resume";
import { fetchTailoredVersions } from "@/actions/tailor-resume";
import { ProviderConfig } from "@/lib/llm/types";
import { Header } from "@/components/layout/Header";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedCallback } from "use-debounce";

const INITIAL_DATA: ResumeData = {
    profile: {
        profession: "",
        yearsOfExperience: 0,
        location: "",
        email: "",
        phone: "",
        linkedin: "",
    },
    experience: [],
    competencies: [],
    education: [],
    generatedSummary: "",
};

const STORAGE_KEY = "interview-os-resume-data";

type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

export default function ResumeBuilder() {
    const [data, setData] = useState<ResumeData>(INITIAL_DATA);
    const [isLoaded, setIsLoaded] = useState(false);
    const [modelConfig, setModelConfig] = useState<Partial<ProviderConfig>>({});
    const [user, setUser] = useState<User | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [versionsSidebarOpen, setVersionsSidebarOpen] = useState(false);
    const [versionsCount, setVersionsCount] = useState(0);
    const pendingSaveRef = useRef<ResumeData | null>(null);

    // Debounced save to database
    const debouncedSave = useDebouncedCallback(
        async (resumeData: ResumeData) => {
            if (!user) return;

            setSyncStatus('saving');
            const result = await saveResumeData(resumeData);

            if (result.error) {
                console.error("[ResumeBuilder] Save error:", result.error);
                setSyncStatus('error');
            } else {
                setSyncStatus('saved');
            }
        },
        1500 // 1.5 second delay
    );

    // Load data from DB (authenticated) or localStorage (guest)
    useEffect(() => {
        const loadData = async () => {
            // Fetch User
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            let resumeLoaded = false;

            // Priority 1: Load from database if authenticated
            if (user) {
                const { data: dbData, error } = await fetchResumeData();
                if (dbData && !error) {
                    setData(dbData);
                    resumeLoaded = true;
                    console.log("[ResumeBuilder] Loaded from database");
                }

                // Also fetch versions count
                const { data: versions } = await fetchTailoredVersions();
                if (versions) {
                    setVersionsCount(versions.length);
                }
            }

            // Priority 2: Fall back to localStorage
            if (!resumeLoaded) {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        setData(parsed);
                        console.log("[ResumeBuilder] Loaded from localStorage");

                        // If user is authenticated, migrate localStorage to DB
                        if (user) {
                            setSyncStatus('saving');
                            await saveResumeData(parsed);
                            setSyncStatus('saved');
                        }
                    } catch (e) {
                        console.error("Failed to parse saved resume data", e);
                    }
                }
            }

            // Set sync status based on auth
            if (!user) {
                setSyncStatus('offline');
            }

            // Load model config for AI generation
            const { data: profileData } = await fetchProfile();
            if (profileData && profileData.preferred_model) {
                const config: Partial<ProviderConfig> = { model: profileData.preferred_model };
                if (profileData.preferred_model.startsWith('gemini')) config.provider = 'gemini';
                else if (profileData.preferred_model.startsWith('gpt')) config.provider = 'openai';
                else config.provider = 'groq';

                if (profileData.custom_api_key && !profileData.custom_api_key.startsWith('{')) {
                    config.apiKey = profileData.custom_api_key;
                }
                setModelConfig(config);
            } else {
                // Guest mode: Load from localStorage
                const guestKey = localStorage.getItem('guest_api_key');
                const guestModel = localStorage.getItem('guest_model');

                if (guestKey && guestModel) {
                    let provider: 'groq' | 'gemini' | 'openai' = 'groq';
                    let model = 'llama-3.3-70b-versatile';

                    if (guestModel.includes(':')) {
                        const parts = guestModel.split(':');
                        provider = parts[0] as any;
                        model = parts.slice(1).join(':');
                    }

                    let apiKey = guestKey;
                    if (guestKey.trim().startsWith('{')) {
                        try {
                            const keys = JSON.parse(guestKey);
                            apiKey = keys[provider] || "";
                        } catch (e) {
                            console.warn("Failed to parse guest API keys", e);
                        }
                    }

                    setModelConfig({ provider, model, apiKey });
                }
            }

            setIsLoaded(true);
        };
        loadData();
    }, []);

    // Save to localStorage always, and debounce save to DB if authenticated
    useEffect(() => {
        if (isLoaded) {
            // Always save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // If authenticated, also save to database (debounced)
            if (user) {
                setSyncStatus('saving');
                debouncedSave(data);
            }
        }
    }, [data, isLoaded, user, debouncedSave]);

    const updateData = useCallback((partialData: Partial<ResumeData>) => {
        setData((prev) => ({ ...prev, ...partialData }));
    }, []);

    const clearData = useCallback(async () => {
        if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            setData(INITIAL_DATA);
            localStorage.removeItem(STORAGE_KEY);

            // Also clear from database if authenticated
            if (user) {
                setSyncStatus('saving');
                await saveResumeData(INITIAL_DATA);
                setSyncStatus('saved');
            }
        }
    }, [user]);

    const handleImport = useCallback((importedData: ResumeData, source: 'pdf' | 'docx' | 'text', confidence: number) => {
        setData(importedData);

        // Save with import metadata
        if (user) {
            setSyncStatus('saving');
            saveResumeData(importedData, source, confidence).then(() => {
                setSyncStatus('saved');
            });
        }
    }, [user]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Main Header */}
            <Header
                user={user}
                showSearch={false}
                title="Resume Builder"
            />

            {/* Main Editor */}
            <ResumeEditor
                data={data}
                onUpdate={updateData}
                onClear={clearData}
                onImport={() => setImportModalOpen(true)}
                modelConfig={modelConfig}
                syncStatus={syncStatus}
                versionsToggle={
                    user ? (
                        <TailoredVersionsToggle
                            isOpen={versionsSidebarOpen}
                            onToggle={() => setVersionsSidebarOpen(!versionsSidebarOpen)}
                            count={versionsCount}
                        />
                    ) : null
                }
            />

            {/* Import Modal */}
            <ResumeImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={handleImport}
            />

            {/* Tailored Versions Sidebar */}
            <TailoredVersionsSidebar
                isOpen={versionsSidebarOpen}
                onClose={() => setVersionsSidebarOpen(false)}
            />
        </div>
    );
}
