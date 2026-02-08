"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Sparkle,
    Envelope,
    Copy,
    Check,
    ArrowsClockwise,
    PencilSimple,
    Lightbulb,
    Lightning
} from "@phosphor-icons/react";
import { ApplicationDraft } from "../ApplicationWizard";
import { generateCoverLetter } from "@/actions/cover-letter";
import { cn } from "@/lib/utils";

interface CoverLetterStepProps {
    draft: ApplicationDraft;
    onUpdate: (updates: Partial<ApplicationDraft>) => void;
}

export function CoverLetterStep({ draft, onUpdate }: CoverLetterStepProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [coverLetter, setCoverLetter] = useState(draft.coverLetter || "");

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Build resume content from base resume
            const resumeContent = draft.baseResume
                ? `
                    Profession: ${draft.baseResume.profile.profession}
                    Summary: ${draft.baseResume.generatedSummary}
                    Experience: ${draft.baseResume.experience.map(e => `${e.role} at ${e.company}: ${e.description}`).join('\n')}
                    Skills: ${draft.baseResume.competencies.map(c => c.skills.join(', ')).join(', ')}
                `
                : "";

            const jobContent = draft.jobText || draft.jobAnalysis?.jobText || "";

            if (!resumeContent || !jobContent) {
                throw new Error("Missing resume or job information");
            }

            const result = await generateCoverLetter(resumeContent, jobContent);

            if (result.error) {
                throw new Error(result.error);
            }

            const newCoverLetter = result.data || "";
            setCoverLetter(newCoverLetter);
            onUpdate({ coverLetter: newCoverLetter });

        } catch (e: any) {
            setError(e.message || "Failed to generate cover letter");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = (text: string) => {
        setCoverLetter(text);
        onUpdate({ coverLetter: text });
    };

    const handleSkip = () => {
        // Mark step as intentionally skipped
        onUpdate({ coverLetter: undefined });
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Cover Letter</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Generate a personalized cover letter based on your resume and job requirements.
                </p>
            </div>

            {/* Cover Letter Content */}
            {!coverLetter ? (
                <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] p-12 text-center">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-5">
                            <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                            <div className="space-y-1">
                                <p className="text-foreground text-sm font-medium">Crafting your cover letter...</p>
                                <p className="text-muted-foreground text-xs">This usually takes 10-20 seconds</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 text-brand">
                                <Sparkle size={32} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Generate Cover Letter</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto leading-relaxed">
                                Our AI will write a compelling cover letter highlighting your relevant experience
                                for {draft.jobAnalysis?.companyName || "this role"}.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="gap-2"
                                    size="lg"
                                    variant="brand"
                                >
                                    <Lightning size={18} weight="fill" />
                                    Generate Cover Letter
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSkip}
                                    size="lg"
                                >
                                    Skip for Now
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Cover Letter</span>
                            <span className="text-xs text-muted-foreground">
                                for {draft.jobAnalysis?.companyName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="gap-1.5 h-8"
                            >
                                <PencilSimple size={14} />
                                {isEditing ? "Preview" : "Edit"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="gap-1.5 h-8"
                            >
                                {isGenerating ? (
                                    <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                                ) : (
                                    <ArrowsClockwise size={14} />
                                )}
                                Regenerate
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopy}
                                className="gap-1.5 h-8"
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} className="text-brand" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isEditing ? (
                            <Textarea
                                value={coverLetter}
                                onChange={(e) => handleEdit(e.target.value)}
                                className="min-h-[400px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 p-0 shadow-none"
                                placeholder="Write your cover letter..."
                                autoFocus
                            />
                        ) : (
                            <div className="prose prose-sm max-w-none text-foreground/80">
                                {coverLetter.split('\n').map((paragraph, i) => (
                                    <p key={i} className="mb-4 text-base leading-relaxed last:mb-0">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                        <Lightbulb size={16} className="text-brand" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-2">Tips for a great cover letter</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                            <li>Personalize the opening with specific details about the company</li>
                            <li>Highlight 2-3 achievements that match the job requirements</li>
                            <li>Keep it concise - ideally under 400 words</li>
                            <li>End with a clear call to action</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
