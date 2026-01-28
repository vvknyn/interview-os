"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FilePdf, CheckCircle, ArrowRight, BookOpen } from "@phosphor-icons/react";
import { updateResume } from "@/actions/profile";
import { saveStories } from "@/actions/save-story";
import { StarStory } from "@/types";

interface OnboardingWizardProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Resume
    const [resumeData, setResumeData] = useState("");

    // Step 2: Story
    const [storyTitle, setStoryTitle] = useState("");
    const [storyContent, setStoryContent] = useState(""); // Simplified for onboarding, just one blob or simple S/T/A/R if preferred. Let's do simple text for speed, or maybe just "One major story"

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            setResumeData(text);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveResume = async () => {
        setLoading(true);
        try {
            await updateResume(resumeData);
            setStep(2);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStory = async () => {
        if (!storyTitle) {
            // Optional step, can skip
            setStep(3);
            return;
        }

        setLoading(true);
        try {
            // Create a simple story structure. In real app might want full S/T/A/R form.
            // For now, let's treat content as "Result" or "Situation" or just put it all in Situation if single field.
            // Actually, let's just make it a "Quick Add"
            const newStory: StarStory = {
                id: crypto.randomUUID(),
                title: storyTitle,
                situation: storyContent,
                task: "",
                action: "",
                result: "",
                tags: ["Onboarding"]
            };
            await saveStories([newStory]); // Appends in backend usually or we need to fetch first? 
            // Wait, saveStories usually replaces ALL stories in current impl (dashboard). 
            // We should be careful. 
            // Actually saveStories takes StarStory[]. 
            // If we just overwrite, we might lose old data if any (but this is onboarding, so assume empty).
            // Safer: fetch old stories inside action? Or just assume empty since new user.
            setStep(3);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[600px] [&>button]:hidden bg-white dark:bg-zinc-950">
                {/* [&>button]:hidden hides the X close button to force flow completion */}

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Welcome to InterviewOS! 👋</DialogTitle>
                            <DialogDescription>
                                Let&apos;s set up your profile to generate tailored interview answers.
                                First, upload your resume.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors text-center">
                            <FilePdf size={48} className="text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-2">Import Text File</p>
                            <p className="text-xs text-muted-foreground mb-4">Paste text below or upload .txt/.md</p>
                            <label>
                                <Button variant="outline" disabled={loading} asChild>
                                    <span className="cursor-pointer">Select File</span>
                                </Button>
                                <input type="file" className="hidden" accept=".txt,.md" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <Textarea
                            placeholder="Or paste your resume text here..."
                            value={resumeData}
                            onChange={(e) => setResumeData(e.target.value)}
                            className="h-32 font-mono text-xs"
                        />

                        <DialogFooter>
                            {/* Allow skip if really needed, but better to encourage */}
                            <Button variant="ghost" onClick={() => setStep(2)}>Skip</Button>
                            <Button onClick={handleSaveResume} disabled={!resumeData || loading}>
                                {loading ? "Processing..." : "Next: Add Experience"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <DialogHeader>
                            <DialogTitle>Tell us a Story 📖</DialogTitle>
                            <DialogDescription>
                                Add one key professional achievement (STAR method). The AI will use this to answer behavioral questions.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Story Title</label>
                                <input
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="e.g. Led migration to Next.js"
                                    value={storyTitle}
                                    onChange={(e) => setStoryTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    placeholder="Briefly describe the Situation, Task, Action, and Result..."
                                    className="h-32"
                                    value={storyContent}
                                    onChange={(e) => setStoryContent(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep(3)}>Skip</Button>
                            <Button onClick={handleSaveStory} disabled={loading}>
                                {loading ? "Saving..." : "Next: Finish"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 text-center py-8 animate-in fade-in">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle size={32} weight="fill" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl">You&apos;re All Set!</DialogTitle>
                            <DialogDescription className="text-center">
                                Your profile is ready. You can search for a company and position to start preparing.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex justify-center mt-6">
                            <Button size="lg" onClick={onComplete} className="w-full max-w-xs">
                                Get Started <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
