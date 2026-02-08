"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateCoverLetter } from "@/actions/cover-letter";
import { CircleNotch, MagicWand, Copy, Check, FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CoverLetterSectionProps {
    initialContent?: string;
    jobUrl?: string;
    resumeContent: string;
    onSave: (content: string) => void;
}

export function CoverLetterSection({ initialContent = "", jobUrl = "", resumeContent, onSave }: CoverLetterSectionProps) {
    const [content, setContent] = useState(initialContent);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!jobUrl && !content) {
            // If completely empty context
        }

        if (!jobUrl) {
            if (!confirm("No Job URL provided. Proceed generating a generic cover letter?")) return;
        }

        setIsGenerating(true);
        try {
            const result = await generateCoverLetter(resumeContent, jobUrl || "General Application");
            if (result.error) {
                console.error(result.error);
                alert(result.error);
            } else if (result.data) {
                setContent(result.data);
                onSave(result.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                        <FileText size={18} weight="fill" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Cover Letter</h3>
                        <p className="text-xs text-muted-foreground">Tailored to the job description</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {content && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                            {isCopied ? "Copied" : "Copy"}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating || !resumeContent}
                        className={cn(
                            "h-8 text-xs gap-1.5 transition-all shadow-sm",
                            isGenerating ? "bg-brand/5 border-brand/20 text-brand" : "hover:bg-brand/5 hover:border-brand/20 hover:text-brand"
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <CircleNotch size={14} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <MagicWand size={14} />
                                Generate with AI
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none rounded-xl" />
                <Textarea
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        onSave(e.target.value);
                    }}
                    placeholder="Describe why you're a great fit for this role..."
                    className="min-h-[240px] font-mono text-sm leading-relaxed p-4 bg-card hover:bg-muted/30 focus:bg-background transition-colors resize-none rounded-xl border-border/60 focus:border-brand/50 shadow-sm"
                />
                {!resumeContent && (
                    <div className="absolute bottom-3 left-3 right-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800/30 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Select a resume version above to enable AI generation.
                    </div>
                )}
            </div>
        </div>
    );
}
