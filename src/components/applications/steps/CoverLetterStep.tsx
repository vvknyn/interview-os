"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    CircleNotch,
    Sparkle,
    Envelope,
    Copy,
    Check,
    ArrowsClockwise,
    PencilSimple
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
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <Envelope size={24} className="text-brand" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">Cover Letter</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Generate a personalized cover letter based on your resume and the job requirements.
                            This step is optional but recommended.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cover Letter Content */}
            {!coverLetter ? (
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 text-center">
                    {isGenerating ? (
                        <div className="space-y-4">
                            <CircleNotch size={40} className="animate-spin mx-auto text-brand" />
                            <p className="text-muted-foreground">Crafting your cover letter...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center mx-auto mb-4">
                                <Sparkle size={32} className="text-brand" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Generate Cover Letter</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Our AI will write a compelling cover letter highlighting your relevant experience
                                for {draft.jobAnalysis?.companyName || "this role"}.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="gap-2"
                                >
                                    <Sparkle size={18} weight="fill" />
                                    Generate Cover Letter
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSkip}
                                >
                                    Skip for Now
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
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
                                    <CircleNotch size={14} className="animate-spin" />
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
                                        <Check size={14} className="text-green-600" />
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
                                className="min-h-[400px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 p-0"
                                placeholder="Write your cover letter..."
                            />
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                {coverLetter.split('\n').map((paragraph, i) => (
                                    <p key={i} className="mb-4 text-base leading-relaxed">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for a great cover letter</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Personalize the opening with specific details about the company</li>
                    <li>• Highlight 2-3 achievements that match the job requirements</li>
                    <li>• Keep it concise - ideally under 400 words</li>
                    <li>• End with a clear call to action</li>
                </ul>
            </div>
        </div>
    );
}
