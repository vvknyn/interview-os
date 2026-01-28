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

            <div className="space-y-4">
                {currentQuestions.map((q, i) => {
                    const globalIndex = startIndex + i;
                    const isLoading = loadingStrategies[globalIndex];
                    const hasStrategy = strategies[globalIndex];

                    return (
                        <div key={i} className="card-premium group" onClick={() => !hasStrategy && handleStrategy(globalIndex, q)}>
                            <div className="p-5 flex gap-4 items-start cursor-pointer hover:bg-slate-50/50 transition-colors rounded-t-xl">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${hasStrategy ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {globalIndex + 1}
                                </span>
                                <div className="flex-1">
                                    <h5 className={`text-slate-800 font-semibold mb-2 group-hover:text-indigo-700 transition-colors ${hasStrategy ? 'text-indigo-900' : ''}`}>
                                        {q}
                                    </h5>

                                    {!hasStrategy && !isLoading && (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all">
                                            <Lightning size={12} weight="fill" className="text-amber-400" />
                                            Click for Strategy
                                        </span>
                                    )}

                                    {isLoading && (
                                        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold mt-2">
                                            <CircleNotch className="animate-spin" size={14} /> Generating Strategy...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {hasStrategy && (
                                <div className="border-t border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white/50 p-6 rounded-b-xl animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 mb-4 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                                        <Lightning size={14} weight="fill" className="text-amber-400" />
                                        AI Strategy
                                    </div>
                                    <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-li:marker:text-indigo-400 prose-headings:text-indigo-900 prose-strong:text-indigo-800">
                                        <div dangerouslySetInnerHTML={{ __html: strategies[globalIndex] }} />
                                    </div>
                                </div>
                            )}
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
