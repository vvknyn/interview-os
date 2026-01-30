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
    const [provider, setProvider] = useState<"groq" | "gemini" | "openai">("groq");
    const [model, setModel] = useState("llama-3.3-70b-versatile");
    const [apiKey, setApiKey] = useState("");

    const PROVIDER_MODELS = {
        groq: [
            { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Recommended)" },
            { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Fast)" },
            { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
            { id: "gemma2-9b-it", name: "Gemma 2 9B" }
        ],
        gemini: [
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Powerful)" },
            { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Preview)" }
        ],
        openai: [
            { id: "gpt-4o", name: "GPT-4o (Best)" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast)" },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }
        ]
    };

    // Update model when provider changes
    useEffect(() => {
        const defaults = {
            groq: "llama-3.3-70b-versatile",
            gemini: "gemini-1.5-flash",
            openai: "gpt-4o"
        };
        setModel(defaults[provider]);
    }, [provider]);

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
                    provider: provider,
                    model: model,
                    apiKey: apiKey
                };
                onSaveGuestSettings(config);
            } else {
                // User mode: save to DB
                // We need to implement a way to save generic provider config, 
                // currently updateModelSettings might primarily support API key.
                // Assuming updateModelSettings handles it or we adapt.
                // The current signature is (apiKey, model). We might need to pass provider effectively.
                // But wait, generate-context logic parses provider from model string "provider:model"
                // So we should format the model string if it's not the default format.
                // Actually generate-context:27 expects "groq:llama..." or just "llama..."
                // let's pass "provider:model" to be safe.
                await updateModelSettings(apiKey, `${provider}:${model}`);
            }
            setStep(5); // Finish
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of code)



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
                            <DialogTitle className="text-2xl">Welcome to Vela! 👋</DialogTitle>
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
                                Configure which AI model to use. you can change this later in settings.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>Select Provider</Label>
                                <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="groq">Groq (Fastest & Free Tier)</SelectItem>
                                        <SelectItem value="gemini">Google Gemini</SelectItem>
                                        <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Select Model</Label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROVIDER_MODELS[provider].map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>API Key {provider === 'groq' ? '(Optional)' : '(Required)'}</Label>
                                <Input
                                    type="password"
                                    placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : 'Groq'} API Key...`}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {provider === 'groq'
                                        ? "Leave blank to use our shared free tier (limited)."
                                        : `You need your own API key for ${provider}.`}
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
