"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FilePdf, CheckCircle, ArrowRight, BookOpen, Brain, Globe, Plus, Trash } from "@phosphor-icons/react";
import { updateResume, updateModelSettings } from "@/actions/profile";
import { saveStories } from "@/actions/save-story";
import { saveSource, deleteSource } from "@/actions/sources";
import { StarStory, SourceItem, ProviderConfig } from "@/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface OnboardingWizardProps {
    isOpen: boolean;
    onComplete: () => void;
    initialResume?: string;
    initialStories?: StarStory[];
    initialSources?: SourceItem[];
    isGuest?: boolean;
    onSaveGuestSettings?: (config: ProviderConfig) => void;
}

export function OnboardingWizard({ isOpen, onComplete, initialResume = "", initialStories = [], initialSources = [], isGuest = false, onSaveGuestSettings }: OnboardingWizardProps) {
    // Determine initial step based on data presence
    const getInitialStep = () => {
        if (!initialResume) return 1;
        if (initialStories.length === 0) return 2;
        if (initialSources.length === 0) return 3;
        // Step 4 is LLM settings, usually optional or default, let's say step 4 if everything else is done
        return 4;
    };

    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // Effect to set initial step when opening
    useEffect(() => {
        if (isOpen) {
            setStep(getInitialStep());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Step 1: Resume
    const [resumeData, setResumeData] = useState(initialResume);

    // Step 2: Story
    const [storyTitle, setStoryTitle] = useState("");
    const [storyContent, setStoryContent] = useState("");

    // Step 3: Sources
    const [sources, setSources] = useState<SourceItem[]>(initialSources);
    const [newSourceUrl, setNewSourceUrl] = useState("");
    const [newSourceText, setNewSourceText] = useState("");
    const [sourceType, setSourceType] = useState<"url" | "text">("url");

    // Step 4: Model
    const [model, setModel] = useState("gemini-1.5-flash");
    const [apiKey, setApiKey] = useState("");

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
            // Skip
            setStep(3);
            return;
        }

        setLoading(true);
        try {
            const newStory: StarStory = {
                id: crypto.randomUUID(),
                title: storyTitle,
                situation: storyContent,
                task: "",
                action: "",
                result: "",
                tags: ["Onboarding"]
            };
            await saveStories([newStory]);
            setStep(3);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSource = async () => {
        setLoading(true);
        try {
            const newItem: Omit<SourceItem, 'id' | 'created_at'> = {
                type: sourceType,
                title: sourceType === 'url' ? newSourceUrl : "Custom Text",
                content: sourceType === 'url' ? newSourceUrl : newSourceText
                // Note: Real fetchUrlContent logic should ideally happen here or in action if URL
            };

            const res = await saveSource(newItem);
            if (res.data) {
                setSources([...sources, res.data]);
                setNewSourceUrl("");
                setNewSourceText("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveModel = async () => {
        setLoading(true);
        try {
            if (isGuest && onSaveGuestSettings) {
                // Guest mode: save to local state/storage
                const config: ProviderConfig = {
                    provider: 'gemini', // Defaulting to Gemini for now as the logic below implies, OR derive from model string
                    model: model,
                    apiKey: apiKey
                };

                // Fine-tune provider based on model selection
                if (model.startsWith('gemini')) config.provider = 'gemini';
                else if (model.startsWith('gpt')) config.provider = 'openai';
                else config.provider = 'groq';

                onSaveGuestSettings(config);
            } else {
                // User mode: save to DB
                await updateModelSettings(apiKey, model);
            }
            setStep(5); // Finish
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = () => {
        return ((step - 1) / 4) * 100;
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[700px] [&>button]:hidden bg-white dark:bg-zinc-950 max-h-[90vh] overflow-y-auto">

                <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Step {step > 4 ? 4 : step} of 4</span>
                        <span>{Math.round(calculateProgress())}% Completed</span>
                    </div>
                    <ProgressBar progress={calculateProgress()} />
                </div>

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
                                <Label>Story Title</Label>
                                <Input
                                    placeholder="e.g. Led migration to Next.js"
                                    value={storyTitle}
                                    onChange={(e) => setStoryTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
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
                                {loading ? "Saving..." : "Next: Knowledge Sources"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <DialogHeader>
                            <DialogTitle>Knowledge Sources 🧠</DialogTitle>
                            <DialogDescription>
                                Add technical documentation, company values, or frameworks you want to reference in your interview.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                            <div className="flex gap-2 mb-2">
                                <Button
                                    size="sm"
                                    variant={sourceType === 'url' ? 'default' : 'ghost'}
                                    onClick={() => setSourceType('url')}
                                >
                                    <Globe className="mr-2" /> URL
                                </Button>
                                <Button
                                    size="sm"
                                    variant={sourceType === 'text' ? 'default' : 'ghost'}
                                    onClick={() => setSourceType('text')}
                                >
                                    <BookOpen className="mr-2" /> Text
                                </Button>
                            </div>

                            {sourceType === 'url' ? (
                                <Input
                                    placeholder="https://react.dev/reference..."
                                    value={newSourceUrl}
                                    onChange={(e) => setNewSourceUrl(e.target.value)}
                                />
                            ) : (
                                <Textarea
                                    placeholder="Paste specific guidelines or notes..."
                                    value={newSourceText}
                                    onChange={(e) => setNewSourceText(e.target.value)}
                                />
                            )}
                            <Button size="sm" onClick={handleAddSource} disabled={loading} variant="secondary" className="w-full">
                                <Plus className="mr-2" /> Add Source
                            </Button>
                        </div>

                        {sources.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                <Label className="text-xs text-muted-foreground">Added Sources:</Label>
                                {sources.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                        <div className="flex items-center gap-2 truncate">
                                            {s.type === 'url' ? <Globe size={14} /> : <BookOpen size={14} />}
                                            <span className="truncate max-w-[300px]">{s.title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep(4)}>Skip</Button>
                            <Button onClick={() => setStep(4)}>
                                Next: AI Settings
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in">
                        <DialogHeader>
                            <DialogTitle>AI Model Settings 🤖</DialogTitle>
                            <DialogDescription>
                                Configure which AI model to use. You can use our default or provide your own API key.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>Preferred Model</Label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</SelectItem>
                                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Smarter)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Custom API Key (Optional)</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter your Gemini API Key..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave blank to use the free tier provided by InterviewOS.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setStep(5)}>Skip</Button>
                            <Button onClick={handleSaveModel} disabled={loading}>
                                {loading ? "Saving..." : "Finish Setup"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 text-center py-8 animate-in fade-in">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle size={32} weight="fill" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl">You&apos;re All Set!</DialogTitle>
                            <DialogDescription className="text-center">
                                Your profile is ready. You can now start generating tailored interview answers.
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
