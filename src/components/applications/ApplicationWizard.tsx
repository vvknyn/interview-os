"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Briefcase, FileText, Envelope, Eye } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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

const STEPS = [
    { id: 1, name: "Job Details", icon: Briefcase, description: "Add the job you're applying for" },
    { id: 2, name: "Tailor Resume", icon: FileText, description: "Customize your resume for this role" },
    { id: 3, name: "Cover Letter", icon: Envelope, description: "Generate a personalized cover letter" },
    { id: 4, name: "Review", icon: Eye, description: "Review and track your application" },
];

interface ApplicationWizardProps {
    onComplete: (draft: ApplicationDraft) => void;
    onCancel: () => void;
    initialData?: Partial<ApplicationDraft>;
}

export function ApplicationWizard({ onComplete, onCancel, initialData }: ApplicationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [draft, setDraft] = useState<ApplicationDraft>(initialData || {
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'applied'
    });
    const [direction, setDirection] = useState(0); // -1 for back, 1 for forward

    // Check if step is complete
    const isStepComplete = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(draft.jobAnalysis?.companyName && draft.jobAnalysis?.positionTitle);
            case 2:
                return !!(draft.selectedRecommendations && draft.selectedRecommendations.length >= 0);
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
            setDirection(-1);
            setCurrentStep(step);
        } else if (step > currentStep && canProceed) {
            setDirection(1);
            setCurrentStep(step);
        }
    };

    const nextStep = () => {
        if (currentStep < 4 && canProceed) {
            setDirection(1);
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep(currentStep - 1);
        }
    };

    const updateDraft = (updates: Partial<ApplicationDraft>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    };

    const handleComplete = () => {
        onComplete(draft);
    };

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -100 : 100,
            opacity: 0
        })
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onCancel}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={16} />
                            Cancel
                        </button>
                        <h1 className="text-sm font-semibold">New Application</h1>
                        <div className="w-16" /> {/* Spacer for centering */}
                    </div>
                </div>
            </header>

            {/* Progress Steps - Apple-style dots */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                    {STEPS.map((step, index) => (
                        <button
                            key={step.id}
                            onClick={() => goToStep(step.id)}
                            disabled={step.id > currentStep && !canProceed}
                            className={cn(
                                "relative flex items-center justify-center transition-all duration-300",
                                step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                            )}
                        >
                            {/* Connector line */}
                            {index > 0 && (
                                <div
                                    className={cn(
                                        "absolute right-full w-8 h-0.5 mr-1",
                                        step.id <= currentStep ? "bg-primary" : "bg-border"
                                    )}
                                />
                            )}
                            {/* Step dot */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                    step.id === currentStep
                                        ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/25"
                                        : step.id < currentStep
                                            ? "bg-primary/20 text-primary"
                                            : "bg-muted text-muted-foreground"
                                )}
                            >
                                {step.id < currentStep ? (
                                    <Check size={18} weight="bold" />
                                ) : (
                                    <step.icon size={18} weight={step.id === currentStep ? "fill" : "regular"} />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
                {/* Current step name */}
                <div className="text-center">
                    <h2 className="text-xl font-semibold mt-4">{STEPS[currentStep - 1].name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{STEPS[currentStep - 1].description}</p>
                </div>
            </div>

            {/* Step Content */}
            <div className="max-w-4xl mx-auto px-6 pb-32">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
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
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation - Fixed */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>

                        <div className="text-xs text-muted-foreground">
                            Step {currentStep} of {STEPS.length}
                        </div>

                        {currentStep < 4 ? (
                            <Button
                                onClick={nextStep}
                                disabled={!canProceed}
                                className="gap-2"
                            >
                                Continue
                                <ArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleComplete}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Check size={16} weight="bold" />
                                Save Application
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
