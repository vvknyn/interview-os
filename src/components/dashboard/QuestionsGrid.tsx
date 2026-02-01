import { ChatCircleDots, CaretLeft, CaretRight, Lightning, ArrowsClockwise, CircleNotch, BookOpen, Code, Users, Briefcase, Icon, Network, SpeakerHigh, Microphone } from "@phosphor-icons/react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useRef } from "react";
import MarkdownIt from "markdown-it";
import { QuestionItem, CompanyReconData } from "@/types";
import { cn } from "@/lib/utils";
import { DashboardSection } from "./DashboardSection";

interface QuestionsGridProps {
    questions: QuestionItem[];
    onRegenerate: () => void;
    onGenerateStrategy: (index: number, question: QuestionItem) => Promise<string>;
    company: string;
    position: string;
    round: string;
    reconData?: CompanyReconData;
}

import { generateAnswerCritique } from "@/actions/generate-context";
import { AnswerCritique } from "@/types";
import { Textarea } from "@/components/ui/textarea";

export function QuestionsGrid({ questions, onRegenerate, onGenerateStrategy, company, position, round, reconData }: QuestionsGridProps) {
    // Strategies stored by Question ID
    const [strategies, setStrategies] = useState<{ [key: string]: string }>({});
    const [loadingStrategies, setLoadingStrategies] = useState<{ [key: string]: boolean }>({});
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Practice Mode State
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [critiques, setCritiques] = useState<{ [key: string]: AnswerCritique }>({});
    const [isAnalyzing, setIsAnalyzing] = useState<{ [key: string]: boolean }>({});

    // Voice State
    const [isSpeaking, setIsSpeaking] = useState(false);
    // const [isListening, setIsListening] = useState(false); // Managed by hook now
    const [selectedVoice, setSelectedVoice] = useState<string>("");
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // --- HOISTED STATE & MEMOS ---

    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<QuestionItem['category'] | 'All'>('All');

    // Helper for Title Case
    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    // Dynamic Categories Logic
    const presentCategories = useMemo(() => {
        const cats = new Set(questions.map(q => q.category).filter(Boolean));
        return Array.from(cats);
    }, [questions]);

    // Icon Mapping
    const iconMap: Record<string, Icon> = {
        'Behavioral': Users,
        'Knowledge': BookOpen,
        'Coding': Code,
        'Case Study': Briefcase,
        'System Design': Network,
        'Product Management': Briefcase,
        'Pm': Briefcase,
        'Execution': Lightning,
        'Technical': Code,
        'Strategy': ArrowsClockwise,
        'General': ChatCircleDots,
        'Leadership': Users,
    };

    const categories: { id: QuestionItem['category'] | 'All', label: string, icon: Icon }[] = useMemo(() => {
        const dynamicCats = presentCategories.map(cat => {
            if (!cat) return null;
            const normalizedTitle = toTitleCase(cat);
            let label = normalizedTitle;
            if (normalizedTitle === 'Pm') label = 'Product Management';
            if (label === 'Product Management') label = 'PM';
            const IconComponent = iconMap[cat] || iconMap[normalizedTitle] || Lightning;
            return { id: cat, label: normalizedTitle, icon: IconComponent };
        }).filter((c): c is { id: string, label: string, icon: Icon } => c !== null);

        return [{ id: 'All', label: 'All', icon: Lightning }, ...dynamicCats.sort((a, b) => a.label.localeCompare(b.label))];
    }, [presentCategories]);

    // Filter Logic
    const filteredQuestions = useMemo(() => {
        if (activeTab === 'All') return questions;
        return questions.filter(q => q.category === activeTab);
    }, [questions, activeTab]);

    const currentQuestion = filteredQuestions[currentIndex];
    const hasNext = currentIndex < filteredQuestions.length - 1;
    const hasPrev = currentIndex > 0;

    // Reset carousel index when category changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeTab]);

    // Stop speaking when question changes
    useEffect(() => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [currentIndex, activeTab]);

    // --- END HOISTED ---

    // --- END HOISTED ---

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } else {
                // Get available voices
                const voices = window.speechSynthesis.getVoices();

                // Prioritize "natural" sounding voices
                // 1. Google US English (often very good)
                // 2. Any "Premium" or "Enhanced" voice (Mac specific)
                // 3. Default
                const preferredVoice = voices.find(v => v.name.includes("Google US English"))
                    || voices.find(v => v.name.includes("Premium"))
                    || voices.find(v => v.name.includes("Enhanced"))
                    || voices.find(v => v.lang === 'en-US');

                const utterance = new SpeechSynthesisUtterance(text);
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }

                utterance.rate = 1.0;
                utterance.pitch = 1.0;

                utterance.onend = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            }
        }
    };

    // --- Voice Hook ---
    const { isListening, isProcessing, startListening, stopListening, error: voiceError } = useSpeechToText({
        onResult: (text) => {
            if (currentQuestion) {
                setUserAnswers(prev => ({
                    ...prev,
                    [currentQuestion.id]: (prev[currentQuestion.id] || "") + " " + text
                }));
            }
        },
        onError: (err) => {
            alert(`Voice input error: ${err}`);
        }
    });

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };



    const handleAnalyzeAnswer = async (question: QuestionItem) => {
        const answer = userAnswers[question.id];
        if (!answer || answer.trim().length < 10) {
            alert("Please provide a longer answer (at least 10 characters) to get a proper critique.");
            return;
        }

        setIsAnalyzing(prev => ({ ...prev, [question.id]: true }));
        try {
            const res = await generateAnswerCritique(question, answer, { company, position, round, reconData });
            if (res.data) {
                setCritiques(prev => ({ ...prev, [question.id]: res.data! }));
            } else if (res.error) {
                alert(`Analysis failed: ${res.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred while analyzing the answer. Please try again.");
        } finally {
            setIsAnalyzing(prev => ({ ...prev, [question.id]: false }));
        }
    };

    const handleRegenerate = async () => {
        if (isRegenerating) return;
        setIsRegenerating(true);
        try {
            await onRegenerate();
        } catch (e) {
            console.error("Regenerate failed", e);
        } finally {
            setIsRegenerating(false);
        }
    };

    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
    });

    const handleNext = () => {
        if (hasNext) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (hasPrev) setCurrentIndex(prev => prev - 1);
    };

    // Expanded State
    const [isExpanded, setIsExpanded] = useState(false);

    // Reset expanded state when question changes
    useEffect(() => {
        setIsExpanded(false);
    }, [currentIndex, activeTab]);

    const toggleExpand = () => setIsExpanded(prev => !prev);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid interfering with inputs if any
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();

            // Expand/Collapse with Space or Enter if focused or generally available
            // Arrow Down to expand, Arrow Up to collapse (optional)
            if (e.key === 'ArrowDown' || e.key === ' ') {
                if (hasStrategy && !isExpanded) {
                    setIsExpanded(true);
                    e.preventDefault();
                }
            }
            if (e.key === 'ArrowUp' || e.key === 'Escape') {
                if (hasStrategy && isExpanded) {
                    setIsExpanded(false);
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown as any);
        return () => window.removeEventListener('keydown', handleKeyDown as any);
    }, [hasNext, hasPrev]);

    const handleStrategy = async (question: QuestionItem) => {
        if (strategies[question.id] || loadingStrategies[question.id]) {
            // If already generated, just expand
            if (strategies[question.id]) setIsExpanded(true);
            return;
        }

        setLoadingStrategies(prev => ({ ...prev, [question.id]: true }));
        try {
            const rawStrategy = await onGenerateStrategy(0, question);
            const parsedStrategy = md.render(rawStrategy);
            setStrategies(prev => ({ ...prev, [question.id]: parsedStrategy }));
            setIsExpanded(true); // Auto-expand on success
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStrategies(prev => ({ ...prev, [question.id]: false }));
        }
    };

    // Derived State for UI
    const isLoading = currentQuestion ? loadingStrategies[currentQuestion.id] : false;
    const hasStrategy = currentQuestion ? strategies[currentQuestion.id] : false;
    const userAnswer = currentQuestion ? userAnswers[currentQuestion.id] || "" : "";
    const critique = currentQuestion ? critiques[currentQuestion.id] : null;
    const analyzing = currentQuestion ? isAnalyzing[currentQuestion.id] : false;

    if (!currentQuestion) {
        return (
            <DashboardSection title="Questions for You" subtitle="Practice answering common interview questions" icon={ChatCircleDots}>
                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                    No questions found for this category.
                </div>
            </DashboardSection>
        );
    }

    return (
        <DashboardSection
            title="Questions for You"
            subtitle="Practice answering common interview questions"
            icon={ChatCircleDots}
            action={
                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setIsPracticeMode(false)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-semibold rounded-md transition-all duration-200",
                                !isPracticeMode
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            Learn
                        </button>
                        <button
                            onClick={() => setIsPracticeMode(true)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5",
                                isPracticeMode
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Lightning size={10} weight={isPracticeMode ? "fill" : "bold"} />
                            Practice
                        </button>
                    </div>

                    {/* Category Select Dropdown */}
                    <Select
                        value={activeTab}
                        onValueChange={(val) => setActiveTab(val as any)}
                    >
                        <SelectTrigger className="w-[160px] h-8 text-xs font-medium bg-background">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                    <div className="flex items-center gap-2 max-w-[140px]">
                                        <cat.icon size={14} className={cn("shrink-0", activeTab === cat.id ? "text-primary" : "text-muted-foreground")} />
                                        <span className="truncate">{cat.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="text-xs h-8 px-2"
                    >
                        <ArrowsClockwise
                            size={14}
                            className={cn("mr-2", isRegenerating && "animate-spin")}
                        />
                        {isRegenerating ? "Regenerating..." : "Regenerate"}
                    </Button>
                </div>
            }
        >
            {/* Carousel Card */}
            <div className="relative group">
                <div className="bg-muted/10 rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col items-center text-center transition-all relative border border-border/40 hover:border-border/60">

                    {/* Left/Right Nav - absolute for better centering of content */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10 md:left-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-background/80 hover:shadow-sm text-muted-foreground hover:text-foreground transition-all"
                            onClick={handlePrev}
                            disabled={!hasPrev}
                        >
                            <CaretLeft size={20} className="md:w-6 md:h-6" />
                        </Button>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10 md:right-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-background/80 hover:shadow-sm text-muted-foreground hover:text-foreground transition-all"
                            onClick={handleNext}
                            disabled={!hasNext}
                        >
                            <CaretRight size={20} className="md:w-6 md:h-6" />
                        </Button>
                    </div>

                    {/* Progress */}
                    <div className="mb-8 flex items-center justify-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-1 rounded-full border border-border/50 shadow-sm">
                            {currentIndex + 1} / {filteredQuestions.length}
                        </span>
                        {currentQuestion.difficulty && (
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border",
                                currentQuestion.difficulty === 'junior' && "bg-green-500/5 text-green-600 border-green-500/20",
                                currentQuestion.difficulty === 'mid' && "bg-yellow-500/5 text-yellow-600 border-yellow-500/20",
                                currentQuestion.difficulty === 'senior' && "bg-orange-500/5 text-orange-600 border-orange-500/20",
                                currentQuestion.difficulty === 'staff+' && "bg-red-500/5 text-red-600 border-red-500/20",
                            )}>
                                {currentQuestion.difficulty}
                            </span>
                        )}
                    </div>

                    {/* Question Header - Centered Content Area */}
                    <div className="relative mb-8 flex flex-col items-center gap-4 max-w-2xl px-8 md:px-12">
                        {/* Read Aloud */}
                        <button
                            onClick={() => handleSpeak(currentQuestion.question)}
                            className="absolute -right-2 top-0 md:-right-8 p-2 rounded-full text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors"
                            title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                        >
                            <SpeakerHigh size={18} weight={isSpeaking ? "fill" : "regular"} className={isSpeaking ? "animate-pulse" : ""} />
                        </button>

                        <h3 className="text-xl md:text-2xl font-medium leading-snug text-foreground tracking-tight">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    {/* Action Area */}
                    <div className="mt-auto w-full mx-auto px-4 pb-4 max-w-3xl">
                        {isPracticeMode ? (
                            <div className="w-full text-left space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                {!critique ? (
                                    <>
                                        <div className="relative pt-2">
                                            <div className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Your Answer
                                            </div>
                                            <Textarea
                                                placeholder={`How would you answer this? (Speak naturally, focusing on ${company}'s context...)`}
                                                className="min-h-[150px] resize-none text-sm p-4 bg-background/50 border hover:border-border/80 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-sans rounded-xl"
                                                value={userAnswer}
                                                onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                                            />
                                            {/* Voice Input Button */}
                                            <button
                                                onClick={toggleListening}
                                                disabled={isProcessing}
                                                className={cn(
                                                    "absolute bottom-4 right-4 p-2 rounded-full transition-all shadow-sm z-10",
                                                    isListening
                                                        ? "bg-red-500 text-white animate-pulse"
                                                        : isProcessing
                                                            ? "bg-yellow-500/20 text-yellow-600 animate-pulse border border-yellow-500/50" // Processing state
                                                            : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                                                )}
                                                title={isProcessing ? "Processing Audio..." : isListening ? "Stop Listening" : "Voice Input"}
                                            >
                                                {isProcessing ? (
                                                    <CircleNotch size={18} className="animate-spin" />
                                                ) : (
                                                    <Microphone size={18} weight={isListening ? "fill" : "regular"} />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => handleAnalyzeAnswer(currentQuestion)}
                                                disabled={analyzing || userAnswer.length < 10}
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm transition-all text-xs font-semibold px-6 py-2 h-auto rounded-lg"
                                            >
                                                {analyzing ? (
                                                    <><CircleNotch className="animate-spin mr-2" /> Analyzing...</>
                                                ) : (
                                                    "Analyze My Answer"
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                                        {/* Critique Header */}
                                        <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "text-xl font-black w-10 h-10 flex items-center justify-center rounded-lg border-2",
                                                    critique.score >= 8 ? "border-green-500 text-green-600 bg-green-500/10" :
                                                        critique.score >= 5 ? "border-yellow-500 text-yellow-600 bg-yellow-500/10" :
                                                            "border-red-500 text-red-600 bg-red-500/10"
                                                )}>
                                                    {critique.score}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                                        Verdict: <span className="text-foreground">{critique.scoreLabel}</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[300px] truncate">
                                                        {critique.tone_analysis}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCritiques(prev => {
                                                    const next = { ...prev };
                                                    delete next[currentQuestion.id];
                                                    return next;
                                                })}
                                                className="text-xs hover:text-red-500"
                                            >
                                                Try Again
                                            </Button>
                                        </div>

                                        {/* Critique Body */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <div>
                                                <h4 className="font-bold text-green-600 flex items-center gap-2 mb-3 text-[10px] uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Strengths
                                                </h4>
                                                <ul className="space-y-2">
                                                    {critique.strengths.map((s, i) => (
                                                        <li key={i} className="flex gap-2 text-foreground/80 text-xs leading-relaxed">
                                                            <span className="text-green-500">✓</span> {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-orange-600 flex items-center gap-2 mb-3 text-[10px] uppercase tracking-wider">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Improvements
                                                </h4>
                                                <ul className="space-y-2">
                                                    {critique.weaknesses.map((w, i) => (
                                                        <li key={i} className="flex gap-2 text-foreground/80 text-xs leading-relaxed">
                                                            <span className="text-orange-500">!</span> {w}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {critique.missing_nuances.length > 0 && (
                                            <div className="bg-primary/5 p-4 border-t border-primary/10">
                                                <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">
                                                    Missed Nuance ({company})
                                                </h4>
                                                <p className="text-foreground/80 italic text-xs">
                                                    "{critique.missing_nuances[0]}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="p-2 bg-gradient-to-r from-transparent via-primary/5 to-transparent flex justify-center">
                                            <button
                                                onClick={() => setIsPracticeMode(false)}
                                                className="text-xs font-medium text-primary hover:underline py-2"
                                            >
                                                Compare with AI Ideal Answer &rarr;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Existing "Learn" Mode (Reveal Answer)
                            !hasStrategy ? (
                                <Button
                                    size="lg"
                                    onClick={() => handleStrategy(currentQuestion)}
                                    disabled={isLoading}
                                    className="w-full md:w-auto px-8 relative overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-md rounded-full bg-foreground text-background hover:bg-foreground/90"
                                >
                                    {isLoading ? (
                                        <>
                                            <CircleNotch className="animate-spin mr-2" /> Generating Answer...
                                        </>
                                    ) : (
                                        <>
                                            <Lightning weight="fill" className="mr-2" /> Reveal Suggested Answer
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="w-full text-left animate-in slide-in-from-bottom-4 transition-all duration-300">
                                    <Button
                                        variant="outline"
                                        onClick={toggleExpand}
                                        className="w-full justify-between mb-2 group h-auto py-3 px-4 border-muted hover:border-primary/50 hover:bg-muted/30 rounded-xl"
                                    >
                                        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                                            <Lightning weight="fill" className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
                                            Suggested Answer
                                        </div>
                                        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                                            {isExpanded ? "Collapse" : "Expand"}
                                        </span>
                                    </Button>

                                    {isExpanded && (
                                        <div className="bg-muted/30 rounded-xl p-6 border border-border/50 animate-in fade-in zoom-in-95 duration-200">
                                            <div
                                                className="prose prose-sm max-w-none dark:prose-invert
                                                prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:my-2 prose-p:text-sm
                                                prose-strong:text-foreground prose-strong:font-semibold
                                                prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2"
                                                dangerouslySetInnerHTML={{ __html: strategies[currentQuestion.id] }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Context/Hint */}
                <div className="text-center mt-3 text-[10px] text-muted-foreground/60">
                    Use arrow keys to navigate • Generated based on role & company context
                </div>
            </div>
        </DashboardSection>
    );
}
