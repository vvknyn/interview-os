"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResumeData } from "@/types/resume";
import { ResumeEditor } from "@/components/resume-builder/ResumeEditor";
import { ResumeImportModal } from "@/components/resume-builder/ResumeImportModal";
import { TailoredVersionsSidebar as TailoringSidebar } from "@/components/resume-builder/TailoredVersionsSidebar";
import { ArrowLeft, Sparkle, ArrowsClockwise, Check } from "@phosphor-icons/react";
import { fetchProfile } from "@/actions/profile";
import { fetchResumeData, saveResumeData } from "@/actions/resume";
import { fetchTailoredVersions } from "@/actions/tailor-resume";
import { ProviderConfig } from "@/lib/llm/types";
import { Header } from "@/components/layout/Header";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedCallback } from "use-debounce";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

export default function ResumeBuilder({ versionId }: { versionId?: string }) {
    const router = useRouter();
    const isTailoredMode = !!versionId;

    const [data, setData] = useState<ResumeData>(INITIAL_DATA);
    const [isLoaded, setIsLoaded] = useState(false);
    const [modelProvider, setModelProvider] = useState<'groq' | 'gemini' | 'openai'>('groq');
    const [modelId, setModelId] = useState('llama-3.3-70b-versatile');
    const [user, setUser] = useState<User | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [tailoringSidebarOpen, setTailoringSidebarOpen] = useState(false);
    const [versionsCount, setVersionsCount] = useState(0);
    const [originalData, setOriginalData] = useState<ResumeData | null>(null);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false); // Track original for diff
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
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            let resumeLoaded = false;

            // Priority 1: If tailored mode, load that specific version
            if (isTailoredMode && versionId && user) {
                const { data: versions } = await fetchTailoredVersions();
                const version = versions?.find(v => v.id === versionId);

                if (version) {
                    // Get base data for profile/education/sectionOrder
                    const { data: baseData } = await fetchResumeData();

                    // Store original data for diff highlighting
                    setOriginalData({
                        profile: baseData?.profile || INITIAL_DATA.profile,
                        education: baseData?.education || INITIAL_DATA.education,
                        experience: version.originalExperience || [],
                        competencies: version.originalCompetencies || [],
                        generatedSummary: version.originalSummary || "",
                        sectionOrder: baseData?.sectionOrder,
                    });

                    setData({
                        profile: baseData?.profile || INITIAL_DATA.profile,
                        education: baseData?.education || INITIAL_DATA.education,
                        experience: version.tailoredExperience || [],
                        competencies: version.tailoredCompetencies || [],
                        generatedSummary: version.tailoredSummary || "",
                        sectionOrder: baseData?.sectionOrder,
                    });
                    resumeLoaded = true;
                    console.log("[ResumeBuilder] Loaded tailored version:", version.versionName, "with education:", baseData?.education?.length);
                }
            }

            // Priority 2: Load from database if authenticated (and not tailored mode)
            if (!resumeLoaded && user) {
                const { data: dbData, error } = await fetchResumeData();
                if (dbData && !error) {
                    setData(dbData);
                    resumeLoaded = true;
                    console.log("[ResumeBuilder] Loaded from database");
                }

                // Load versions count
                const { data: versions } = await fetchTailoredVersions();
                if (versions) {
                    setVersionsCount(versions.length);
                }
            }

            // Priority 3: Fall back to localStorage
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
                let provider: 'groq' | 'gemini' | 'openai' = 'groq';
                let model = profileData.preferred_model;

                if (profileData.preferred_model.startsWith('gemini')) provider = 'gemini';
                else if (profileData.preferred_model.startsWith('gpt')) provider = 'openai';
                else provider = 'groq';

                setModelProvider(provider);
                setModelId(model);
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

                    setModelProvider(provider);
                    setModelId(model);
                }
            }

            setIsLoaded(true);
        };
        loadData();
    }, [versionId, isTailoredMode]);

    // Save to localStorage always, and debounce save to DB if authenticated
    // IMPORTANT: Do NOT save to DB when viewing a tailored version - that would overwrite the base resume
    useEffect(() => {
        if (isLoaded) {
            // Only save to localStorage when NOT in tailored mode
            // (In tailored mode, we don't want to overwrite the base resume in localStorage either)
            if (!isTailoredMode) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

                // If authenticated, also save to database (debounced)
                if (user) {
                    setSyncStatus('saving');
                    debouncedSave(data);
                }
            } else {
                // In tailored mode, just show saved status (changes are to the tailored version, not base)
                setSyncStatus('saved');
            }
        }
    }, [data, isLoaded, user, debouncedSave, isTailoredMode]);

    // Listen for version updates (deletions, creates) and refresh count + handle navigation
    useEffect(() => {
        const handleVersionUpdate = async () => {
            const { data: versions } = await fetchTailoredVersions();

            if (versions) {
                // Update the count
                setVersionsCount(versions.length);

                // If we're viewing a version that no longer exists, navigate
                if (isTailoredMode && versionId) {
                    const currentVersionExists = versions.some(v => v.id === versionId);

                    if (!currentVersionExists) {
                        // Current version was deleted - navigate to next available or base
                        if (versions.length > 0) {
                            // Navigate to the first available version
                            router.push(`/resume-builder?versionId=${versions[0].id}`);
                        } else {
                            // No versions left - go to base resume
                            router.push('/resume-builder');
                        }
                    }
                }
            }
        };

        window.addEventListener('version-updated', handleVersionUpdate);
        return () => window.removeEventListener('version-updated', handleVersionUpdate);
    }, [isTailoredMode, versionId, router]);

    const updateData = useCallback((partialData: Partial<ResumeData>) => {
        setData((prev) => ({ ...prev, ...partialData }));
    }, []);

    const clearData = () => {
        setClearConfirmOpen(true);
    };

    const confirmClear = async () => {
        // Clear data completely
        setData(INITIAL_DATA);
        setOriginalData(null);

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);

        // Clear database if authenticated
        if (user) {
            setSyncStatus('saving');
            try {
                await saveResumeData(INITIAL_DATA);
                setSyncStatus('saved');
            } catch (err) {
                console.error("Failed to clear database resume:", err);
                setSyncStatus('error');
            }
        }

        // If in tailored mode, navigate to base resume
        if (isTailoredMode) {
            router.push('/resume-builder');
        }

        setClearConfirmOpen(false);
        console.log("[ResumeBuilder] Resume data cleared");
    };

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

    const handleModelChange = useCallback((provider: 'groq' | 'gemini' | 'openai', model: string) => {
        setModelProvider(provider);
        setModelId(model);
    }, []);

    // State for "Make Base" feature
    const [isMakingBase, setIsMakingBase] = useState(false);
    const [madeBase, setMadeBase] = useState(false);

    const handleMakeBase = async () => {
        if (!user || !isTailoredMode) return;

        const confirmed = window.confirm(
            "This will copy the current tailored version to your base resume. Your original base resume will be replaced. Continue?"
        );

        if (!confirmed) return;

        setIsMakingBase(true);
        try {
            // Save current data as the base resume
            const result = await saveResumeData(data);

            if (result.error) {
                alert("Failed to update base resume: " + result.error);
            } else {
                setMadeBase(true);
                // Show success briefly then redirect
                setTimeout(() => {
                    router.push('/resume-builder');
                }, 1500);
            }
        } catch (err) {
            console.error("Error making base:", err);
            alert("Failed to update base resume");
        } finally {
            setIsMakingBase(false);
        }
    };

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
                modelProvider={modelProvider}
                modelId={modelId}
                onModelChange={handleModelChange}
            />

            {isTailoredMode && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
                    <span className="font-medium text-amber-900 dark:text-amber-200">📋 Viewing Tailored Version</span>
                    <span className="text-amber-300">|</span>
                    <Link href="/resume-builder" className="hover:underline flex items-center text-amber-700 dark:text-amber-300">
                        <ArrowLeft className="mr-1" size={14} />
                        Back to Standard
                    </Link>
                    <span className="text-amber-300">|</span>
                    <button
                        onClick={handleMakeBase}
                        disabled={isMakingBase || madeBase}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${madeBase
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                            } disabled:opacity-70`}
                    >
                        {madeBase ? (
                            <>
                                <Check size={14} weight="bold" />
                                Made Base!
                            </>
                        ) : isMakingBase ? (
                            <>
                                <ArrowsClockwise size={14} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <ArrowsClockwise size={14} weight="bold" />
                                Make This My Base Resume
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Main Editor */}
            <ResumeEditor
                data={data}
                onUpdate={updateData}
                onClear={clearData}
                onImport={() => setImportModalOpen(true)}
                syncStatus={syncStatus}
                originalData={originalData} // Pass for diff highlighting
                isTailoredMode={isTailoredMode}
                versionsToggle={
                    user ? (
                        <button
                            onClick={() => setTailoringSidebarOpen(true)}
                            className="group inline-flex items-center h-9 px-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                        >
                            <Sparkle size={16} weight="fill" className="text-primary shrink-0" />
                            <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">
                                    Tailor Resume
                                </span>
                            </span>
                            {versionsCount > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    {versionsCount}
                                </span>
                            )}
                        </button>
                    ) : null
                }
            />

            {/* Import Modal */}
            <ResumeImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={handleImport}
            />

            {/* Clear Confirmation Dialog */}
            <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Clear All Resume Data?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all your resume content including your name, experience, education, skills, and summary. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setClearConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmClear}
                        >
                            Clear Resume
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Darkened Backdrop */}
            {tailoringSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] animate-in fade-in duration-300"
                    onClick={() => setTailoringSidebarOpen(false)}
                />
            )}

            {/* Tailoring Sidebar */}
            <TailoringSidebar
                isOpen={tailoringSidebarOpen}
                onClose={() => setTailoringSidebarOpen(false)}
                currentVersionId={versionId}
            />
        </div>
    );
}
