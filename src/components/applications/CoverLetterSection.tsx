"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateCoverLetter } from "@/actions/cover-letter";
import { Loader2, Wand2 } from "lucide-react";
// import { toast } from "sonner"; // Removed

// Fallback if toast not found
const safeToast = (msg: string) => {
    // console.log("Toast:", msg);
};

interface CoverLetterSectionProps {
    initialContent?: string;
    jobUrl?: string; // or job description text?
    resumeContent: string;
    onSave: (content: string) => void;
}

export function CoverLetterSection({ initialContent = "", jobUrl = "", resumeContent, onSave }: CoverLetterSectionProps) {
    const [content, setContent] = useState(initialContent);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!jobUrl && !content) {
            // If nothing to go on...
            // Actually, user might want to generate based just on resume (general)?
            // But requirement says "based on my resume an the job link".
        }

        if (!jobUrl) {
            // Allow pasting JD into a field? 
            // For now, let's assume they might paste JD into the jobUrl field or we rely on them having something.
            // If jobUrl is empty, we warn.
            if (!confirm("No Job URL provided. Proceed generating a generic cover letter?")) return;
        }

        setIsGenerating(true);
        try {
            const result = await generateCoverLetter(resumeContent, jobUrl || "General Application");
            if (result.error) {
                console.error(result.error);
                // toast.error(result.error);
            } else if (result.data) {
                setContent(result.data);
                safeToast("Cover letter generated!");
                onSave(result.data); // optional auto-save
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Cover Letter</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || !resumeContent}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate with AI
                        </>
                    )}
                </Button>
            </div>

            <Textarea
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    onSave(e.target.value);
                }}
                placeholder="Paste your cover letter here or generate one..."
                className="min-h-[300px] font-mono text-sm"
            />
            {!resumeContent && (
                <p className="text-xs text-muted-foreground text-yellow-600">
                    * Select a resume version to enable AI generation.
                </p>
            )}
        </div>
    );
}
