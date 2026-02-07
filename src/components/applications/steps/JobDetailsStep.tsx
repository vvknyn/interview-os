"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Link as LinkIcon,
    FileText,
    Buildings,
    Briefcase,
    CircleNotch,
    CheckCircle,
    Sparkle,
    ListBullets
} from "@phosphor-icons/react";
import { ApplicationDraft } from "../ApplicationWizard";
import { fetchUrlContent } from "@/actions/fetch-url";
import { analyzeJobRequirements } from "@/actions/tailor-resume";
import { cn } from "@/lib/utils";

interface JobDetailsStepProps {
    draft: ApplicationDraft;
    onUpdate: (updates: Partial<ApplicationDraft>) => void;
}

export function JobDetailsStep({ draft, onUpdate }: JobDetailsStepProps) {
    const [inputMode, setInputMode] = useState<"url" | "text">(draft.jobUrl ? "url" : "text");
    const [jobUrl, setJobUrl] = useState(draft.jobUrl || "");
    const [jobText, setJobText] = useState(draft.jobText || "");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let textToAnalyze = jobText;

            // If URL mode, fetch the content first
            if (inputMode === "url" && jobUrl) {
                setLoadingMessage("Fetching job posting...");
                const fetchResult = await fetchUrlContent(jobUrl);
                if (fetchResult.error) {
                    throw new Error(fetchResult.error);
                }
                textToAnalyze = fetchResult.data || "";
                setJobText(textToAnalyze);
            }

            if (!textToAnalyze || textToAnalyze.trim().length < 50) {
                throw new Error("Please provide more details about the job posting.");
            }

            // Analyze the job posting
            setLoadingMessage("Analyzing job requirements...");
            const analysisResult = await analyzeJobRequirements(textToAnalyze);

            if (analysisResult.error) {
                throw new Error(analysisResult.error);
            }

            // Update draft with analysis
            onUpdate({
                jobUrl: inputMode === "url" ? jobUrl : undefined,
                jobText: textToAnalyze,
                jobAnalysis: analysisResult.data
            });

        } catch (e: any) {
            setError(e.message || "Failed to analyze job posting");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    const hasAnalysis = draft.jobAnalysis?.companyName && draft.jobAnalysis?.positionTitle;

    return (
        <div className="space-y-8">
            {/* Input Section */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                {/* Toggle */}
                <div className="flex border-b border-border/50">
                    <button
                        onClick={() => {
                            setInputMode("url");
                            setError(null);
                        }}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors",
                            inputMode === "url"
                                ? "bg-brand/5 text-brand border-b-2 border-brand"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LinkIcon size={16} className="inline mr-2" />
                        Paste URL
                    </button>
                    <button
                        onClick={() => {
                            setInputMode("text");
                            setError(null);
                        }}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors",
                            inputMode === "text"
                                ? "bg-brand/5 text-brand border-b-2 border-brand"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <FileText size={16} className="inline mr-2" />
                        Paste Text
                    </button>
                </div>

                {/* Input Area */}
                <div className="p-6">
                    {inputMode === "url" ? (
                        <div className="space-y-2">
                            <Label htmlFor="jobUrl" className="text-sm font-medium">Job Posting URL</Label>
                            <Input
                                id="jobUrl"
                                type="url"
                                placeholder="https://careers.company.com/job/..."
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                className="h-12 text-base"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the link to the job posting. We'll extract the details automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="jobText" className="text-sm font-medium">Job Description</Label>
                            <Textarea
                                id="jobText"
                                placeholder="Paste the full job description here..."
                                value={jobText}
                                onChange={(e) => setJobText(e.target.value)}
                                className="min-h-[200px] text-base resize-none"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Copy and paste the entire job posting including requirements and qualifications.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleAnalyze}
                        disabled={isLoading || (inputMode === "url" ? !jobUrl : !jobText)}
                        className="w-full mt-6 h-12 text-base gap-2"
                    >
                        {isLoading ? (
                            <>
                                <CircleNotch size={18} className="animate-spin" />
                                {loadingMessage || "Analyzing..."}
                            </>
                        ) : (
                            <>
                                <Sparkle size={18} weight="fill" />
                                Analyze Job Posting
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Analysis Result */}
            {hasAnalysis && draft.jobAnalysis && (
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-border/50 bg-green-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle size={20} weight="fill" className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-900">Job Analyzed Successfully</h3>
                                <p className="text-sm text-green-700">We've extracted the key details from this posting</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Company & Position */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                                    <Buildings size={14} />
                                    Company
                                </div>
                                <p className="text-lg font-semibold">{draft.jobAnalysis.companyName}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                                    <Briefcase size={14} />
                                    Position
                                </div>
                                <p className="text-lg font-semibold">{draft.jobAnalysis.positionTitle}</p>
                            </div>
                        </div>

                        {/* Requirements */}
                        {draft.jobAnalysis.extractedRequirements && draft.jobAnalysis.extractedRequirements.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                                    <ListBullets size={14} />
                                    Key Requirements
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {draft.jobAnalysis.extractedRequirements.slice(0, 6).map((req, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                                        >
                                            {req}
                                        </span>
                                    ))}
                                    {draft.jobAnalysis.extractedRequirements.length > 6 && (
                                        <span className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm">
                                            +{draft.jobAnalysis.extractedRequirements.length - 6} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {draft.jobAnalysis.extractedSkills && draft.jobAnalysis.extractedSkills.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                                    Skills & Technologies
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {draft.jobAnalysis.extractedSkills.slice(0, 8).map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
