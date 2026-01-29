import { ChatCircleDots, CaretLeft, CaretRight, Lightning, ArrowsClockwise, CircleNotch, BookOpen, Code, Users, Briefcase, Icon, Network } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import MarkdownIt from "markdown-it";
import { QuestionItem } from "@/types";
import { cn } from "@/lib/utils";

interface QuestionsGridProps {
    questions: QuestionItem[];
    onRegenerate: () => void;
    onGenerateStrategy: (index: number, question: QuestionItem) => Promise<string>;
}

export function QuestionsGrid({ questions, onRegenerate, onGenerateStrategy }: QuestionsGridProps) {
    // Strategies stored by Question ID
    const [strategies, setStrategies] = useState<{ [key: string]: string }>({});
    const [loadingStrategies, setLoadingStrategies] = useState<{ [key: string]: boolean }>({});

    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0);

    // Dynamic Categories Logic
    const presentCategories = useMemo(() => {
        const cats = new Set(questions.map(q => q.category));
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
    };

    const categories: { id: QuestionItem['category'] | 'All', label: string, icon: Icon }[] = useMemo(() => {
        const dynamicCats = presentCategories.map(cat => ({
            id: cat,
            label: cat === 'Product Management' ? 'PM' : cat,
            icon: iconMap[cat || ''] || Lightning // Fallback icon
        }));

        // Always put "All" first
        return [
            { id: 'All', label: 'All', icon: Lightning },
            ...dynamicCats.sort((a, b) => a.label.localeCompare(b.label))
        ];
    }, [presentCategories]);

    // Active Category State
    const [activeTab, setActiveTab] = useState<QuestionItem['category'] | 'All'>('All');

    // Filter Logic
    const filteredQuestions = useMemo(() => {
        if (activeTab === 'All') return questions;
        return questions.filter(q => q.category === activeTab);
    }, [questions, activeTab]);

    // Reset carousel index when category changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeTab]);

    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
    });

    const currentQuestion = filteredQuestions[currentIndex];
    const hasNext = currentIndex < filteredQuestions.length - 1;
    const hasPrev = currentIndex > 0;

    const handleNext = () => {
        if (hasNext) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (hasPrev) setCurrentIndex(prev => prev - 1);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };

        window.addEventListener('keydown', handleKeyDown as any);
        return () => window.removeEventListener('keydown', handleKeyDown as any);
    }, [hasNext, hasPrev]);

    const handleStrategy = async (question: QuestionItem) => {
        if (strategies[question.id] || loadingStrategies[question.id]) return;

        setLoadingStrategies(prev => ({ ...prev, [question.id]: true }));
        try {
            const rawStrategy = await onGenerateStrategy(0, question);
            const parsedStrategy = md.render(rawStrategy);
            setStrategies(prev => ({ ...prev, [question.id]: parsedStrategy }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStrategies(prev => ({ ...prev, [question.id]: false }));
        }
    };

    // Derived State for UI
    const ActiveIcon = categories.find(c => c.id === activeTab)?.icon || Lightning;

    if (!currentQuestion) {
        return (
            <section className="animate-in fade-in pt-6">
                <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <ChatCircleDots size={20} weight="fill" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Interview Questions</h2>
                            <p className="text-sm text-muted-foreground">Practice key questions for this role</p>
                        </div>
                    </div>
                </div>
                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                    No questions found for this category.
                </div>
            </section>
        );
    }

    const isLoading = loadingStrategies[currentQuestion.id];
    const hasStrategy = strategies[currentQuestion.id];

    return (
        <section className="animate-in fade-in pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <ChatCircleDots size={20} weight="fill" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Interview Questions</h2>
                        <p className="text-sm text-muted-foreground">Practice key questions for this role</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Category Select Dropdown */}
                    <Select
                        value={activeTab}
                        onValueChange={(val) => setActiveTab(val as any)}
                    >
                        <SelectTrigger className="w-[180px] h-9 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <ActiveIcon size={14} weight="bold" />
                                <SelectValue placeholder="Category" />
                            </div>
                        </SelectTrigger>
                        <SelectContent align="end">
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <cat.icon size={14} className={activeTab === cat.id ? "text-primary" : "text-muted-foreground"} />
                                        {cat.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="sm" onClick={onRegenerate} className="text-xs h-9">
                        <ArrowsClockwise size={14} className="mr-1" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Carousel Card */}
            <div className="relative group">
                <div className="bg-card rounded-2xl p-8 min-h-[400px] flex flex-col items-center text-center transition-all animate-in zoom-in-95 duration-300 relative shadow-sm hover:shadow-md">

                    {/* Navigation - Absolute to Card */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={handlePrev}
                            disabled={!hasPrev}
                        >
                            <CaretLeft size={24} />
                        </Button>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={handleNext}
                            disabled={!hasNext}
                        >
                            <CaretRight size={24} />
                        </Button>
                    </div>

                    {/* Progress */}
                    <div className="mb-6 flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            Question {currentIndex + 1} of {filteredQuestions.length}
                        </span>
                        {currentQuestion.difficulty && (
                            <span className={cn(
                                "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                currentQuestion.difficulty === 'junior' && "bg-green-500/10 text-green-600",
                                currentQuestion.difficulty === 'mid' && "bg-yellow-500/10 text-yellow-600",
                                currentQuestion.difficulty === 'senior' && "bg-orange-500/10 text-orange-600",
                                currentQuestion.difficulty === 'staff+' && "bg-red-500/10 text-red-600",
                            )}>
                                {currentQuestion.difficulty}
                            </span>
                        )}
                    </div>

                    {/* Question Text */}
                    <div className="mb-8 max-w-2xl mx-auto px-8">
                        <h3 className="text-2xl md:text-3xl font-semibold leading-tight text-foreground">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    {/* Action Area */}
                    <div className="mt-auto w-full max-w-3xl mx-auto px-4">
                        {!hasStrategy ? (
                            <Button
                                size="lg"
                                onClick={() => handleStrategy(currentQuestion)}
                                disabled={isLoading}
                                className="w-full md:w-auto px-8 relative overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-md"
                            >
                                {isLoading ? (
                                    <>
                                        <CircleNotch className="animate-spin mr-2" /> Generating Answer...
                                    </>
                                ) : (
                                    <>
                                        <Lightning weight="fill" className="mr-2" /> Generate AI Answer
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="w-full text-left bg-muted/30 rounded-lg p-6 border border-border/50 animate-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-2 mb-4 text-primary font-semibold text-sm uppercase tracking-wider">
                                    <Lightning weight="fill" /> Suggested Answer
                                </div>
                                <div
                                    className="prose prose-sm max-w-none dark:prose-invert
                                        prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:my-2
                                        prose-strong:text-foreground prose-strong:font-semibold
                                        prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2"
                                    dangerouslySetInnerHTML={{ __html: strategies[currentQuestion.id] }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Context/Hint */}
            <div className="text-center mt-4 text-xs text-muted-foreground opacity-50">
                Use arrow keys to navigate • Generated based on role & company context
            </div>
        </section>
    );
}
