import { Target, CheckCircle, Plus, X } from "@phosphor-icons/react";
import { MatchData } from "@/types";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface MatchSectionProps {
    data: MatchData;
    onAddMatch?: (match: string) => void;
    onRemoveMatch?: (match: string) => void;
}


export function MatchSection({ data, onAddMatch, onRemoveMatch }: MatchSectionProps) {
    const renderedReasoning = useMemo(() => md.render(data.reasoning || ""), [data.reasoning]);
    const [newMatch, setNewMatch] = useState("");

    const handleAdd = () => {
        if (newMatch.trim() && onAddMatch) {
            onAddMatch(newMatch.trim());
            setNewMatch("");
        }
    };

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

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 items-center">
                    {data.matched_entities?.map((match, i) => (
                        <div key={i} className="group relative flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-lg shadow-sm hover:shadow-md transition-all cursor-default">
                            <CheckCircle size={16} className="text-emerald-500" weight="fill" />
                            <span className="text-sm font-semibold text-slate-700">{match}</span>
                            <button
                                onClick={() => onRemoveMatch && onRemoveMatch(match)}
                                className="opacity-50 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-all"
                                title="Remove match"
                            >
                                <X size={12} weight="bold" />
                            </button>
                        </div>
                    ))}

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMatch}
                            onChange={(e) => setNewMatch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            placeholder="Add experience..."
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all w-48 shadow-sm"
                        />
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleAdd}
                            disabled={!newMatch.trim()}
                            className="h-9 w-9 p-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                        >
                            <Plus size={16} weight="bold" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
