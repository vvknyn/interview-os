"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResumeData, JobAnalysis, TailoringRecommendation, TailoredResumeVersion } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, Loader2, Info as InfoIcon, AlertTriangle, X, RefreshCw, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { analyzeJobRequirements, generateTailoringRecommendations, saveTailoredVersion } from "@/actions/tailor-resume";
import { fetchResumeData } from "@/actions/resume";
import { JobAnalysisPanel } from "@/components/resume-tailor/JobAnalysisPanel";
import { RecommendationsPanel } from "@/components/resume-tailor/RecommendationsPanel";
import { TailoredVersionsList } from "@/components/resume-tailor/TailoredVersionsList";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const RESUME_STORAGE_KEY = "interview-os-resume-data";

function ResumeTailorContent() {
    const searchParams = useSearchParams();
    const prefilledCompany = searchParams.get("company");
    const prefilledPosition = searchParams.get("position");

    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [jobInput, setJobInput] = useState("");
    const [jobUrl, setJobUrl] = useState("");
    const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
    const [recommendations, setRecommendations] = useState<TailoringRecommendation[]>([]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [analysisSheetOpen, setAnalysisSheetOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    // Load resume data from DB (authenticated) or localStorage (guest)
    useEffect(() => {
        const loadResume = async () => {
            // Try database first for authenticated users
            const { data: dbData, error } = await fetchResumeData();
            if (dbData && !error) {
                setResumeData(dbData);
                console.log("[ResumeTailor] Loaded from database");
                return;
            }

            // Fall back to localStorage
            const saved = localStorage.getItem(RESUME_STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    setResumeData(data);
                    console.log("[ResumeTailor] Loaded from localStorage");
                } catch (e) {
                    console.error("Failed to load resume data", e);
                }
            }
        };
        loadResume();
    }, []);

    // Prefill job input if coming from dashboard
    useEffect(() => {
        if (prefilledCompany || prefilledPosition) {
            const prefilled = `${prefilledCompany || ""} ${prefilledPosition || ""}`.trim();
            setJobInput(`Looking for job posting information for ${prefilled}`);
        }
    }, [prefilledCompany, prefilledPosition]);

    const [sheetState, setSheetState] = useState<{ isOpen: boolean; view: 'analysis' | 'recommendations' }>({
        isOpen: false,
        view: 'analysis'
    });

    useEffect(() => {
        // If analysis is ready but not recommendations, show analysis
        if (jobAnalysis && !analysisSheetOpen && !sheetOpen) {
            // Logic to auto-open if needed or just rely on user click
        }
    }, [jobAnalysis]);

    const handleOpenAnalysis = () => {
        setSheetState({ isOpen: true, view: 'analysis' });
    };

    const handleAnalyzeJob = async () => {
        if (!jobInput.trim()) {
            setError("Please enter a job posting");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await analyzeJobRequirements(jobInput, jobUrl || undefined);

            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setJobAnalysis(result.data);
                setRecommendations([]); // Clear old recommendations
                setSheetState({ isOpen: true, view: 'analysis' });
            }
        } catch (e: any) {
            setError(e.message || "Failed to analyze job posting");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateRecommendations = async () => {
        if (!resumeData) {
            setError("No resume data found. Please create a resume first.");
            return;
        }
        if (!jobAnalysis) {
            setError("Please analyze the job posting first");
            return;
        }

        setIsGenerating(true);
        setError(null);
        // Keep sheet open, just show loading state inside if we were using a dedicated loader component
        // But for now we can just rely on isGenerating to show spinner in the button 
        // OR better: transition to recommendations view immediately and show loading there?
        // Let's keep it simple: Stay in analysis view with loading button, then switch.

        try {
            const result = await generateTailoringRecommendations(resumeData, jobAnalysis);

            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setRecommendations(result.data);
                setSheetState({ isOpen: true, view: 'recommendations' });
            }
        } catch (e: any) {
            setError(e.message || "Failed to generate recommendations");
        } finally {
            setIsGenerating(false);
        }
    };

    const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

    // Initial load from URL
    useEffect(() => {
        const versionId = searchParams.get("versionId");
        if (versionId) {
            setActiveVersionId(versionId);
            // In a real app we might fetch the specific version data here if not already loaded by a parent wrapper
            // For now we assume the user flow starts from analysis or selects a version which sets context
        }
    }, [searchParams]);

    const handleSaveVersion = async (versionName: string, appliedRecommendations: TailoringRecommendation[]) => {
        if (!resumeData || !jobAnalysis) return;

        // Create tailored version by applying recommendations
        const tailoredData = {
            id: activeVersionId || undefined, // Pass ID to update if exists
            versionName,
            jobAnalysisId: jobAnalysis.id,
            originalSummary: resumeData.generatedSummary,
            originalExperience: resumeData.experience,
            originalCompetencies: resumeData.competencies,
            originalProfile: resumeData.profile,
            originalEducation: resumeData.education,
            sectionOrder: resumeData.sectionOrder,
            tailoredSummary: resumeData.generatedSummary,
            tailoredExperience: resumeData.experience,
            tailoredCompetencies: resumeData.competencies,
            recommendations: appliedRecommendations,
            companyName: jobAnalysis.companyName,
            positionTitle: jobAnalysis.positionTitle,
            jobPosting: jobAnalysis.jobText, // Include the job posting
            appliedAt: new Date().toISOString() // Update applied time on save
        };

        const result = await saveTailoredVersion(tailoredData);

        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            console.log("Version saved successfully!");
            setActiveVersionId(result.data.id); // Set active ID after save
            // Trigger list refresh
            window.dispatchEvent(new Event('version-updated'));
        }
    };

    const handleFetchUrl = async () => {
        if (!jobUrl.trim()) return;
        setIsAnalyzing(true);
        setError(null);

        try {
            const { fetchUrlContent } = await import("@/actions/fetch-url");
            const result = await fetchUrlContent(jobUrl);

            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setJobInput(result.data);
            }
        } catch (e: any) {
            setError(e.message || "Failed to fetch URL");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header
                user={user}
                showSearch={false}
                title="Tailor Resume"
            />

            <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">

                {!resumeData && (
                    <div className="p-6 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
                        <InfoIcon className="w-5 h-5 shrink-0" />
                        <p>No resume found. Please <Link href="/resume-builder" className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-100">create a resume</Link> first.</p>
                    </div>
                )}

                {error && (
                    <div className="p-6 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Job Input */}
                    <div className="xl:col-span-8 space-y-8 min-w-0">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Job Posting</h2>
                                {jobAnalysis && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenAnalysis}
                                        className="text-xs"
                                    >
                                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                                        View Analysis
                                    </Button>
                                )}
                            </div>

                            <Card className="border-border shadow-sm">
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-foreground/80">
                                            Job URL (Optional)
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://company.com/careers/job-123"
                                                value={jobUrl}
                                                onChange={(e) => setJobUrl(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleFetchUrl();
                                                    }
                                                }}
                                                className="bg-background"
                                            />
                                            <Button
                                                variant="secondary"
                                                onClick={handleFetchUrl}
                                                disabled={isAnalyzing || !jobUrl.trim()}
                                            >
                                                Fetch
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-foreground/80">
                                            Job Description *
                                        </label>
                                        <Textarea
                                            placeholder="Paste the full job posting text here..."
                                            value={jobInput}
                                            onChange={(e) => setJobInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                    e.preventDefault();
                                                    handleAnalyzeJob();
                                                }
                                            }}
                                            rows={12}
                                            className="font-mono text-sm leading-relaxed bg-background resize-y min-h-[300px]"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleAnalyzeJob}
                                        disabled={isAnalyzing || !jobInput.trim() || !resumeData}
                                        className="w-full h-12 text-base shadow-sm"
                                        size="lg"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Analyzing Job Posting...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Analyze & Extract Requirements
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    {/* Right Column: Saved Versions */}
                    <div className="xl:col-span-4 xl:border-l xl:pl-8 mt-8 xl:mt-0">
                        <div className="xl:sticky xl:top-8 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold">Saved Versions</h3>
                            </div>
                            <TailoredVersionsList />
                        </div>
                    </div>
                </div>

                {/* Unified Sheet */}
                <Sheet
                    open={sheetState.isOpen}
                    onOpenChange={(open) => setSheetState(prev => ({ ...prev, isOpen: open }))}
                >
                    <SheetContent side="right" className="p-0 flex flex-col overflow-hidden sm:max-w-xl w-full" hideCloseButton>
                        {/* Custom Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-neutral-950 sticky top-0 z-10 transition-all duration-300">
                            <div className="flex items-center gap-3">
                                {sheetState.view === 'recommendations' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSheetState({ isOpen: true, view: 'analysis' })}
                                        className="h-8 w-8 -ml-2 rounded-full mr-1"
                                    >
                                        <ArrowRight className="w-4 h-4 rotate-180" />
                                    </Button>
                                )}

                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    {sheetState.view === 'analysis' ? (
                                        <FileText className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <SheetTitle className="text-lg font-semibold">
                                        {sheetState.view === 'analysis' ? 'Job Analysis' : 'Tailoring Recommendations'}
                                    </SheetTitle>
                                    <SheetDescription className="sr-only">
                                        View and manage job analysis details and tailoring recommendations.
                                    </SheetDescription>
                                    {sheetState.view === 'recommendations' && (
                                        <p className="text-xs text-muted-foreground animate-in fade-in">
                                            {recommendations.length} suggestions found
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {sheetState.view === 'recommendations' && (
                                    <Button
                                        onClick={handleGenerateRecommendations}
                                        disabled={isGenerating || !jobAnalysis}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                        Regenerate
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSheetState({ ...sheetState, isOpen: false })}
                                    className="h-8 w-8 rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content Area - Swappable */}
                        <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-950 relative">
                            {/* Analysis View */}
                            <div className={`absolute inset-0 transition-all duration-300 ${sheetState.view === 'analysis' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-20 opacity-0 z-0 pointer-events-none'}`}>
                                <div className="px-6 py-6">
                                    {jobAnalysis && <JobAnalysisPanel analysis={jobAnalysis} />}
                                </div>
                            </div>

                            {/* Recommendations View */}
                            <div className={`absolute inset-0 transition-all duration-300 ${sheetState.view === 'recommendations' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-20 opacity-0 z-0 pointer-events-none'}`}>
                                <div className="h-full">
                                    {resumeData && (
                                        <RecommendationsPanel
                                            recommendations={recommendations}
                                            resumeData={resumeData}
                                            onSaveVersion={handleSaveVersion}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer for Analysis View */}
                        {sheetState.view === 'analysis' && (
                            <div className="border-t bg-white dark:bg-neutral-950 px-6 py-4 space-y-3 z-20">
                                {resumeData && (
                                    <Button
                                        onClick={handleGenerateRecommendations}
                                        disabled={isGenerating}
                                        className="w-full h-11 text-base"
                                        size="lg"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating Recommendations...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Tailoring Recommendations
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        setSheetState({ ...sheetState, isOpen: false });
                                        handleAnalyzeJob();
                                    }}
                                    disabled={isAnalyzing}
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                    Reanalyze Job Posting
                                </Button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

export default function ResumeTailor() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground/30" />
            </div>
        }>
            <ResumeTailorContent />
        </Suspense>
    );
}
