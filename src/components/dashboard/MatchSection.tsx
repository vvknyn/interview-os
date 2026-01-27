import { Target, CheckCircle, Plus, X } from "@phosphor-icons/react";
import { MatchData } from "@/types";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface MatchSectionProps {
    data: MatchData;
    onAddMatch?: (match: string) => void;
    onRemoveMatch?: (match: string) => void;
}

export function MatchSection({ data, onAddMatch, onRemoveMatch }: MatchSectionProps) {
    const renderedReasoning = useMemo(() => md.render(data.reasoning || ""), [data.reasoning]);

    return (
        <section className="animate-in delay-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={22} className="text-indigo-600" weight="fill" />
                Matched Experiences
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-extrabold border border-indigo-100">
                    {data.matched_entities?.length || 0}
                </span>
            </h3>

            <div className="card-premium p-6 md:p-8 mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-slate-900 mb-2">{data.headline}</h4>
                        <div className="text-slate-600 text-sm leading-relaxed ai-content mb-4"
                            dangerouslySetInnerHTML={{ __html: renderedReasoning }} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    {data.matched_entities?.map((match, i) => (
                        <div key={i} className="group relative flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-lg shadow-sm hover:shadow-md transition-all cursor-default">
                            <CheckCircle size={16} className="text-emerald-500" weight="fill" />
                            <span className="text-sm font-semibold text-slate-700">{match}</span>
                            <button
                                onClick={() => onRemoveMatch && onRemoveMatch(match)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-all"
                            >
                                <X size={12} weight="bold" />
                            </button>
                        </div>
                    ))}

                    {/* Add/Edit Input would go here, simplified for now */}
                </div>
            </div>
        </section>
    );
}
