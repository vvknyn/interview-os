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
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
                <Target size={22} className="text-primary" weight="fill" />
                Matched Experiences
                <span className="bg-secondary text-primary border-border rounded-full border px-2 py-0.5 text-xs font-extrabold">
                    {data.matched_entities?.length || 0}
                </span>
            </h3>

            <div className="bg-card border-border mb-6 rounded-xl border p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                        <h4 className="text-foreground mb-2 text-xl font-bold">{data.headline}</h4>
                        <div className="text-muted-foreground ai-content mb-4 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderedReasoning }} />
                    </div>
                </div>

                <div className="border-border mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                    {data.matched_entities?.map((match, i) => (
                        <div key={i} className="bg-secondary hover:bg-secondary/80 border-border group relative flex cursor-default items-center gap-2 rounded-lg border px-4 py-2 transition-all">
                            <CheckCircle size={16} className="text-primary" weight="fill" />
                            <span className="text-foreground text-sm font-semibold">{match}</span>
                            <button
                                onClick={() => onRemoveMatch && onRemoveMatch(match)}
                                className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-full p-1 opacity-50 transition-all group-hover:opacity-100"
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
                            className="bg-background border-input focus:border-primary focus:ring-ring w-48 rounded-lg border px-3 py-2 text-sm shadow-none transition-all focus:outline-none focus:ring-2"
                        />
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleAdd}
                            disabled={!newMatch.trim()}
                            className="bg-primary hover:bg-primary/90 h-9 w-9 rounded-lg p-0 shadow-none"
                        >
                            <Plus size={16} weight="bold" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
