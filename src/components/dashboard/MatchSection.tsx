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
        <section className="animate-infade-in pt-8 border-t border-border">
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Matched Experiences</h3>
                <h4 className="text-base font-medium mb-3">{data.headline}</h4>
                <div className="text-sm text-muted-foreground leading-relaxed ai-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderedReasoning }} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-6">
                {data.matched_entities?.map((match, i) => (
                    <div key={i} className="group relative flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border px-3 py-1.5 text-sm transition-colors">
                        <span>{match}</span>
                        <button
                            onClick={() => onRemoveMatch && onRemoveMatch(match)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                        >
                            <X size={14} weight="bold" />
                        </button>
                    </div>
                ))}

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMatch}
                        onChange={(e) => setNewMatch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder="Add experience"
                        className="bg-transparent border-b border-border focus:border-foreground outline-none px-2 py-1 text-sm w-40 transition-colors"
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleAdd}
                        disabled={!newMatch.trim()}
                        className="h-7 w-7 p-0"
                    >
                        <Plus size={14} weight="bold" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
