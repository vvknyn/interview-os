import { ChatCircleDots, CaretLeft, CaretRight, Lightning, ArrowsClockwise, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import MarkdownIt from "markdown-it";

interface QuestionsGridProps {
    questions: string[];
    onRegenerate: () => void;
    onTweak: () => void;
    onGenerateStrategy: (index: number, question: string) => Promise<string>;
}


export function QuestionsGrid({ questions, onRegenerate, onTweak, onGenerateStrategy }: QuestionsGridProps) {
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;
    const [strategies, setStrategies] = useState<{ [key: number]: string }>({});
    const [loadingStrategies, setLoadingStrategies] = useState<{ [key: number]: boolean }>({});

    const totalPages = Math.ceil(questions.length / itemsPerPage);
    const startIndex = page * itemsPerPage;
    const currentQuestions = questions.slice(startIndex, startIndex + itemsPerPage);
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
    });

    const nextPage = () => setPage(p => Math.min(p + 1, totalPages - 1));
    const prevPage = () => setPage(p => Math.max(p - 1, 0));

    const handleStrategy = async (index: number, question: string) => {
        if (strategies[index] || loadingStrategies[index]) return;

        setLoadingStrategies(prev => ({ ...prev, [index]: true }));
        try {
            const rawStrategy = await onGenerateStrategy(index, question);
            const parsedStrategy = md.render(rawStrategy);
            setStrategies(prev => ({ ...prev, [index]: parsedStrategy }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStrategies(prev => ({ ...prev, [index]: false }));
        }
    };

    return (
        <section className="animate-in fade-in pt-8 border-t border-border">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Questions</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={prevPage} disabled={page === 0} className="h-8 w-8 p-0">
                            <CaretLeft size={14} />
                        </Button>
                        <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                        <Button variant="ghost" size="sm" onClick={nextPage} disabled={page >= totalPages - 1} className="h-8 w-8 p-0">
                            <CaretRight size={14} />
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onRegenerate} className="text-xs">
                        <ArrowsClockwise size={14} className="mr-1" /> Regenerate
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {currentQuestions.map((q, i) => {
                    const globalIndex = startIndex + i;
                    const isLoading = loadingStrategies[globalIndex];
                    const hasStrategy = strategies[globalIndex];

                    return (
                        <div key={i} className="group">
                            <div className="flex gap-4 cursor-pointer" onClick={() => !hasStrategy && handleStrategy(globalIndex, q)}>
                                <span className="text-xs text-muted-foreground pt-0.5 w-6 flex-shrink-0">
                                    {globalIndex + 1}.
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm mb-2 group-hover:text-foreground transition-colors">
                                        {q}
                                    </p>
                                    {!hasStrategy && !isLoading && (
                                        <button className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                                            Generate strategy
                                        </button>
                                    )}
                                    {isLoading && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CircleNotch className="animate-spin" size={12} /> Generating...
                                        </div>
                                    )}
                                    {hasStrategy && (
                                        <div className="mt-4 pt-4 border-t border-border/50 prose prose-sm max-w-none text-sm text-muted-foreground">
                                            <div dangerouslySetInnerHTML={{ __html: strategies[globalIndex] }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
