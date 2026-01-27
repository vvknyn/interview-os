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
    const md = new MarkdownIt();

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
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ChatCircleDots size={22} className="text-violet-600" weight="fill" />
                    Strategic Questions
                </h3>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={prevPage} disabled={page === 0} className="text-slate-500 hover:text-slate-900">
                        <CaretLeft size={16} />
                    </Button>
                    <span className="text-xs font-bold text-slate-400 py-2">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button variant="ghost" size="sm" onClick={nextPage} disabled={page >= totalPages - 1} className="text-slate-500 hover:text-slate-900">
                        <CaretRight size={16} />
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {currentQuestions.map((q, i) => {
                    const globalIndex = startIndex + i;
                    const isLoading = loadingStrategies[globalIndex];
                    const hasStrategy = strategies[globalIndex];

                    return (
                        <div key={i} className="card-premium p-5 group cursor-pointer hover:border-indigo-200" onClick={() => handleStrategy(globalIndex, q)}>
                            <div className="flex gap-4 items-start">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
                                    {globalIndex + 1}
                                </span>
                                <div className="flex-1">
                                    <h5 className="text-slate-800 font-semibold mb-2 group-hover:text-indigo-700 transition-colors">
                                        {q}
                                    </h5>

                                    {!hasStrategy && !isLoading && (
                                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">Click for Strategy</span>
                                    )}

                                    {isLoading && (
                                        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold mt-2">
                                            <CircleNotch className="animate-spin" size={14} /> Generating Strategy...
                                        </div>
                                    )}

                                    {hasStrategy && (
                                        <div className="mt-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm text-slate-700 animate-in fade-in prose prose-sm max-w-none prose-indigo">
                                            <div className="flex items-center gap-2 mb-2 text-indigo-600 text-xs font-bold uppercase tracking-wider not-prose">
                                                <Lightning size={14} weight="fill" /> Strategy
                                            </div>
                                            <div dangerouslySetInnerHTML={{ __html: strategies[globalIndex] }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-center gap-4">
                <Button variant="outline" onClick={onTweak} className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 gap-2 font-semibold">Tweak Context</Button>
                <Button onClick={onRegenerate} className="bg-slate-900 text-white hover:bg-indigo-600 gap-2 font-semibold shadow-lg shadow-indigo-500/10">
                    <ArrowsClockwise size={16} /> Regenerate
                </Button>
            </div>
        </section>
    );
}
