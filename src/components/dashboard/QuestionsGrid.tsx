
import { ChatCircleDots, CaretLeft, CaretRight, Lightning, ArrowsClockwise, CircleNotch, BookOpen, Code, Users, Briefcase } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
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

    // Tabs
    const [activeTab, setActiveTab] = useState<QuestionItem['category'] | 'All'>('All');

    const categories: { id: QuestionItem['category'] | 'All', label: string, icon: any }[] = [
        { id: 'All', label: 'All', icon: Lightning },
        { id: 'Behavioral', label: 'Behavioral', icon: Users },
        { id: 'Knowledge', label: 'Knowledge', icon: BookOpen },
        { id: 'Coding', label: 'Coding', icon: Code },
        { id: 'Case Study', label: 'Case Study', icon: Briefcase },
    ];

    // Filter Logic
    const filteredQuestions = useMemo(() => {
        if (activeTab === 'All') return questions;
        return questions.filter(q => q.category === activeTab);
    }, [questions, activeTab]);

    // Pagination
    const [page, setPage] = useState(0);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const startIndex = page * itemsPerPage;
    const currentQuestions = filteredQuestions.slice(startIndex, startIndex + itemsPerPage);

    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
    });

    const nextPage = () => setPage(p => Math.min(p + 1, totalPages - 1));
    const prevPage = () => setPage(p => Math.max(p - 1, 0));

    // Reset page on tab change
    useMemo(() => setPage(0), [activeTab]);

    const handleStrategy = async (question: QuestionItem) => {
        if (strategies[question.id] || loadingStrategies[question.id]) return;

        setLoadingStrategies(prev => ({ ...prev, [question.id]: true }));
        try {
            // Pass the whole question object (index 0 is placeholder as ID is primary now)
            const rawStrategy = await onGenerateStrategy(0, question);
            const parsedStrategy = md.render(rawStrategy);
            setStrategies(prev => ({ ...prev, [question.id]: parsedStrategy }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStrategies(prev => ({ ...prev, [question.id]: false }));
        }
    };

    return (
        <section className="animate-in fade-in pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ChatCircleDots size={20} className="text-primary" />
                    Interview Questions
                </h3>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                                activeTab === cat.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                            )}
                        >
                            <cat.icon size={14} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onRegenerate} className="text-xs h-8">
                        <ArrowsClockwise size={14} className="mr-1" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {currentQuestions.map((q, i) => {
                    const isLoading = loadingStrategies[q.id];
                    const hasStrategy = strategies[q.id];

                    return (
                        <div key={q.id} className="group border border-border/40 rounded-xl p-4 hover:border-border transition-colors bg-card/30">
                            <div className="flex gap-4 cursor-pointer" onClick={() => !hasStrategy && handleStrategy(q)}>
                                <div className="pt-0.5 flex-shrink-0">
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                                        q.category === 'Behavioral' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                        q.category === 'Knowledge' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                                        q.category === 'Coding' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                                        q.category === 'Case Study' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                    )}>
                                        {q.category.substring(0, 1)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-medium mb-2 group-hover:text-primary transition-colors">
                                        {q.question}
                                    </p>

                                    {!hasStrategy && !isLoading && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button className="text-xs font-medium text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
                                                <Lightning size={12} weight="fill" />
                                                Generate Answer
                                            </button>
                                        </div>
                                    )}

                                    {isLoading && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                            <CircleNotch className="animate-spin" size={14} /> Generating Answer...
                                        </div>
                                    )}

                                    {hasStrategy && (
                                        <div className="mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2">
                                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                                <div dangerouslySetInnerHTML={{ __html: strategies[q.id] }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State for Filter */}
                {currentQuestions.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        No questions found for this category.
                    </div>
                )}
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <Button variant="ghost" size="sm" onClick={prevPage} disabled={page === 0} className="h-8 w-8 p-0">
                        <CaretLeft size={14} />
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">{page + 1} / {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={nextPage} disabled={page >= totalPages - 1} className="h-8 w-8 p-0">
                        <CaretRight size={14} />
                    </Button>
                </div>
            )}
        </section>
    );
}
