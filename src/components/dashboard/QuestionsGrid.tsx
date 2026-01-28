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
    const itemsPerPage = 5;
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
        <section className="animate-in delay-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
                    <ChatCircleDots size={22} className="text-primary" weight="fill" />
                    Strategic Questions
                </h3>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={prevPage} disabled={page === 0} className="text-muted-foreground hover:text-foreground">
                        <CaretLeft size={16} />
                    </Button>
                    <span className="text-muted-foreground py-2 text-xs font-bold">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button variant="ghost" size="sm" onClick={nextPage} disabled={page >= totalPages - 1} className="text-muted-foreground hover:text-foreground">
                        <CaretRight size={16} />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {currentQuestions.map((q, i) => {
                    const globalIndex = startIndex + i;
                    const isLoading = loadingStrategies[globalIndex];
                    const hasStrategy = strategies[globalIndex];

                    return (
                        <div key={i} className="bg-card border-border group rounded-xl border" onClick={() => !hasStrategy && handleStrategy(globalIndex, q)}>
                            <div className="hover:bg-secondary/50 flex cursor-pointer items-start gap-4 rounded-t-xl p-5 transition-colors">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${hasStrategy ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                    {globalIndex + 1}
                                </span>
                                <div className="flex-1">
                                    <h5 className={`text-foreground font-semibold mb-2 group-hover:text-primary transition-colors ${hasStrategy ? 'text-primary' : ''}`}>
                                        {q}
                                    </h5>

                                    {!hasStrategy && !isLoading && (
                                        <span className="bg-background border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase transition-all">
                                            <Lightning size={12} weight="fill" className="text-amber-400" />
                                            Click for Strategy
                                        </span>
                                    )}

                                    {isLoading && (
                                        <div className="text-primary mt-2 flex items-center gap-2 text-xs font-bold">
                                            <CircleNotch className="animate-spin" size={14} /> Generating Strategy...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {hasStrategy && (
                                <div className="border-border bg-secondary/30 animate-in slide-in-from-top-2 rounded-b-xl border-t p-6 duration-300">
                                    <div className="text-primary mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                        <Lightning size={14} weight="fill" className="text-amber-400" />
                                        AI Strategy
                                    </div>
                                    <div className="prose prose-sm max-w-none prose-neutral prose-p:leading-relaxed">
                                        <div dangerouslySetInnerHTML={{ __html: strategies[globalIndex] }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-center gap-4">
                <Button variant="outline" onClick={onTweak} className="bg-background border-border text-muted-foreground hover:text-primary gap-2 font-semibold">Tweak Context</Button>
                <Button onClick={onRegenerate} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold shadow-none">
                    <ArrowsClockwise size={16} /> Regenerate
                </Button>
            </div>
        </section>
    );
}
