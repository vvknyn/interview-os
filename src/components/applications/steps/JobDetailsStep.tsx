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
    CheckCircle,
    Sparkle,
    ListBullets
} from "@phosphor-icons/react";
import { ApplicationDraft } from "../ApplicationWizard";
import { fetchUrlContent } from "@/actions/fetch-url";
import { analyzeJobRequirements } from "@/actions/tailor-resume";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

        } catch (e: unknown) {
            setError((e as Error).message || "Failed to analyze job posting");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    const hasAnalysis = draft.jobAnalysis?.companyName && draft.jobAnalysis?.positionTitle;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Job Details</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Paste the job posting to analyze requirements and tailor your resume.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
                <Tabs value={inputMode} onValueChange={(val) => setInputMode(val as "url" | "text")} className="w-full">
                    <div className="border-b border-border/50 bg-muted/20 px-6 py-2">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="url">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Paste URL
                            </TabsTrigger>
                            <TabsTrigger value="text">
                                <FileText className="mr-2 h-4 w-4" />
                                Paste Text
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6">
                        <TabsContent value="url" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="jobUrl">Job Posting URL</Label>
                                <Input
                                    id="jobUrl"
                                    type="url"
                                    placeholder="https://careers.google.com/jobs/..."
                                    value={jobUrl}
                                    onChange={(e) => setJobUrl(e.target.value)}
                                    className="h-11"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    We'll automatically extract the job description and requirements.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="text" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="jobText">Job Description</Label>
                                <Textarea
                                    id="jobText"
                                    placeholder="Paste the full job description here..."
                                    value={jobText}
                                    onChange={(e) => setJobText(e.target.value)}
                                    className="min-h-[240px] resize-y font-mono text-sm leading-relaxed"
                                    disabled={isLoading}
                                />
                            </div>
                        </TabsContent>

                        {error && (
                            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleAnalyze}
                            disabled={isLoading || (inputMode === "url" ? !jobUrl : !jobText)}
                            className="w-full mt-6 h-11"
                            size="lg"
                            variant="brand"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin mr-2" />
                                    {loadingMessage || "Analyzing..."}
                                </>
                            ) : (
                                <>
                                    <Sparkle size={18} weight="fill" className="mr-2" />
                                    Analyze Job Posting
                                </>
                            )}
                        </Button>
                    </div>
                </Tabs>
            </div>

            {/* Analysis Result */}
            {hasAnalysis && draft.jobAnalysis && (
                <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border border-brand/20">
                    <div className="p-6 border-b border-brand/10 bg-brand/5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <CheckCircle size={20} weight="fill" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Analysis Complete</h3>
                            <p className="text-sm text-muted-foreground">We've extracted the key details from this posting</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <Buildings size={12} />
                                    Company
                                </div>
                                <p className="text-lg font-medium text-foreground">{draft.jobAnalysis.companyName}</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <Briefcase size={12} />
                                    Position
                                </div>
                                <p className="text-lg font-medium text-foreground">{draft.jobAnalysis.positionTitle}</p>
                            </div>
                        </div>

                        {draft.jobAnalysis.extractedRequirements && draft.jobAnalysis.extractedRequirements.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <ListBullets size={12} />
                                    Key Requirements
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {draft.jobAnalysis.extractedRequirements.slice(0, 8).map((req, i) => (
                                        <div
                                            key={i}
                                            className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-lg text-xs text-foreground transition-colors"
                                        >
                                            {req}
                                        </div>
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
