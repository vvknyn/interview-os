"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Briefcase, FileText, Envelope, Eye, X, ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { fetchResumeData } from "@/actions/resume";

// Step Components
import { JobDetailsStep } from "./steps/JobDetailsStep";
import { ResumeTailoringStep } from "./steps/ResumeTailoringStep";
import { CoverLetterStep } from "./steps/CoverLetterStep";
import { ReviewStep } from "./steps/ReviewStep";

// Types
import { ResumeData, JobAnalysis, TailoringRecommendation, TailoredResumeVersion } from "@/types/resume";

export interface ApplicationDraft {
    // Step 1: Job Details
    jobUrl?: string;
    jobText?: string;
    jobAnalysis?: JobAnalysis;

    // Step 2: Resume Tailoring
    baseResume?: ResumeData;
    recommendations?: TailoringRecommendation[];
    selectedRecommendations?: TailoringRecommendation[];
    tailoredResume?: Partial<TailoredResumeVersion>;
    versionName?: string;

    // Step 3: Cover Letter
    coverLetter?: string;

    // Step 4: Review
    applicationDate?: string;
    status?: 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
}

// --- Session cache helpers ---
const CACHE_KEY = "interview-os:wizard-draft";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedWizardState {
    draft: ApplicationDraft;
    step: number;
    timestamp: number;
}

function getCachedState(): CachedWizardState | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached: CachedWizardState = JSON.parse(raw);
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
        return cached;
    } catch {
        return null;
    }
}

function cacheState(draft: ApplicationDraft, step: number) {
    try {
        const state: CachedWizardState = { draft, step, timestamp: Date.now() };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(state));
    } catch { /* quota exceeded — non-critical */ }
}

function clearCache() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}

const STEPS = [
    { id: 1, name: "Job Details", icon: Briefcase, description: "Job description" },
    { id: 2, name: "Tailor Resume", icon: FileText, description: "Customize resume" },
    { id: 3, name: "Cover Letter", icon: Envelope, description: "Write cover letter" },
    { id: 4, name: "Review", icon: Eye, description: "Finalize application" },
];

interface ApplicationWizardProps {
    onComplete: (draft: ApplicationDraft) => void;
    onCancel: () => void;
    initialData?: Partial<ApplicationDraft>;
}

export function ApplicationWizard({ onComplete, onCancel, initialData }: ApplicationWizardProps) {
    // Restore from session cache on mount (lazy initializers run once)
    const [currentStep, setCurrentStep] = useState(() => {
        const cached = getCachedState();
        return cached?.step || 1;
    });
    const [draft, setDraft] = useState<ApplicationDraft>(() => {
        const cached = getCachedState();
        if (cached?.draft) return cached.draft;
        return initialData || {
            applicationDate: new Date().toISOString().split('T')[0],
            status: 'applied'
        };
    });

    // Track whether we restored from cache (affects resume loading)
    const restoredFromCache = useRef(!!getCachedState()?.draft?.baseResume);

    // Pre-fetch resume when wizard opens — so it's ready by Step 2
    // If cache already has baseResume, skip the loading state
    const [resumeData, setResumeData] = useState<ResumeData | null>(() => {
        const cached = getCachedState();
        return cached?.draft?.baseResume || null;
    });
    const [resumeLoading, setResumeLoading] = useState(() => !restoredFromCache.current);
    const [resumeError, setResumeError] = useState<string | null>(null);

    // Persist draft + step to sessionStorage on every change
    useEffect(() => {
        cacheState(draft, currentStep);
    }, [draft, currentStep]);

    useEffect(() => {
        // If we already have resume from cache, still refresh in background
        // but don't block the UI
        let cancelled = false;
        const loadResume = async () => {
            try {
                const result = await fetchResumeData();
                if (cancelled) return;
                if (result.error) {
                    // Only set error if we don't already have cached resume data
                    if (!resumeData) setResumeError(result.error);
                } else if (result.data) {
                    setResumeData(result.data);
                    setDraft(prev => ({ ...prev, baseResume: result.data }));
                }
            } catch {
                if (!cancelled && !resumeData) setResumeError("Failed to load resume");
            } finally {
                if (!cancelled) setResumeLoading(false);
            }
        };
        loadResume();
        return () => { cancelled = true; };
    }, []);

    // Check if step is complete
    const isStepComplete = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(draft.jobAnalysis?.companyName && draft.jobAnalysis?.positionTitle);
            case 2:
                // Tailoring is optional — user can always proceed.
                // If they generated recommendations, great. If not, they track with original resume.
                return true;
            case 3:
                return true; // Cover letter is optional
            case 4:
                return true;
            default:
                return false;
        }
    };

    const canProceed = isStepComplete(currentStep);

    const goToStep = (step: number) => {
        if (step < currentStep) {
            setCurrentStep(step);
        } else if (step > currentStep && canProceed) {
            setCurrentStep(step);
        }
    };

    const nextStep = () => {
        if (currentStep < 4 && canProceed) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const updateDraft = useCallback((updates: Partial<ApplicationDraft>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    }, []);

    const handleComplete = () => {
        clearCache();
        onComplete(draft);
    };

    const handleStartOver = () => {
        clearCache();
        setCurrentStep(1);
        setDraft({
            applicationDate: new Date().toISOString().split('T')[0],
            status: 'applied',
            baseResume: resumeData || undefined
        });
    };

    // Whether the draft has meaningful user-entered data worth clearing
    const hasDraftData = !!(draft.jobText || draft.jobUrl || draft.jobAnalysis || draft.coverLetter || draft.recommendations?.length);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-[var(--shadow-sm)]">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X size={20} />
                        </Button>
                        <div className="h-6 w-px bg-border/50" />
                        <h1 className="text-sm font-semibold">New Application</h1>
                        {hasDraftData && (
                            <>
                                <div className="h-6 w-px bg-border/50" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleStartOver}
                                    className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
                                >
                                    <ArrowsClockwise size={14} />
                                    <span className="hidden sm:inline">Start Over</span>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Progress Stepper */}
                    <div className="hidden md:flex items-center gap-1">
                        {STEPS.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;
                            const isClickable = step.id < currentStep || (step.id > currentStep && canProceed);
                            const StepIcon = step.icon;

                            return (
                                <div key={step.id} className="flex items-center">
                                    {index > 0 && (
                                        <div className={cn(
                                            "w-10 h-px mx-1 transition-colors duration-300",
                                            step.id <= currentStep ? "bg-brand/40" : "bg-border"
                                        )} />
                                    )}
                                    <button
                                        onClick={() => isClickable && goToStep(step.id)}
                                        disabled={!isClickable}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive && "bg-brand/10 text-brand",
                                            isCompleted && "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                            !isActive && !isCompleted && "text-muted-foreground/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-all",
                                            isActive && "bg-brand text-brand-foreground",
                                            isCompleted && "bg-brand/10 text-brand",
                                            !isActive && !isCompleted && "bg-muted text-muted-foreground"
                                        )}>
                                            {isCompleted ? <Check weight="bold" size={14} /> : <StepIcon size={16} />}
                                        </div>
                                        <span className="hidden lg:inline">{step.name}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 pb-32">
                <div className="mb-8 md:hidden">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        Step {currentStep} of {STEPS.length}
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight">{STEPS[currentStep - 1].name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{STEPS[currentStep - 1].description}</p>
                </div>

                <div
                    key={currentStep}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                    {currentStep === 1 && (
                        <JobDetailsStep
                            draft={draft}
                            onUpdate={updateDraft}
                        />
                    )}
                    {currentStep === 2 && (
                        <ResumeTailoringStep
                            draft={draft}
                            onUpdate={updateDraft}
                            resumeData={resumeData}
                            resumeLoading={resumeLoading}
                            resumeError={resumeError}
                        />
                    )}
                    {currentStep === 3 && (
                        <CoverLetterStep
                            draft={draft}
                            onUpdate={updateDraft}
                        />
                    )}
                    {currentStep === 4 && (
                        <ReviewStep
                            draft={draft}
                            onUpdate={updateDraft}
                        />
                    )}
                </div>
            </main>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="gap-2 text-muted-foreground"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>

                    <div className="md:hidden text-xs text-muted-foreground font-medium">
                        Step {currentStep} of {STEPS.length}
                    </div>

                    {currentStep < 4 ? (
                        <Button
                            onClick={nextStep}
                            disabled={!canProceed}
                            className="gap-2"
                            variant="brand"
                        >
                            Continue
                            <ArrowRight size={16} />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            className="gap-2"
                            variant="brand"
                        >
                            <Check size={16} weight="bold" />
                            Save Application
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
