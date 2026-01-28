import { X } from "@phosphor-icons/react";
import { MatchData } from "@/types";
import { useMemo } from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface MatchSectionProps {
    data: MatchData;
    onAddMatch?: (match: string) => void;
    onRemoveMatch?: (match: string) => void;
    allowedMatches?: string[];
    jobContext?: string;
}


export function MatchSection({ data, onAddMatch, onRemoveMatch, allowedMatches = [], jobContext }: MatchSectionProps) {
    const renderedReasoning = useMemo(() => md.render(data.reasoning || ""), [data.reasoning]);

    // Logic for select
    const handleAdd = (val: string) => {
        if (onAddMatch) {
            onAddMatch(val);
        }
    };

    return (
        <section className="animate-in fade-in pt-8 border-t border-border">
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Matched Experiences</h3>
                <h4 className="text-base font-medium mb-3">{data.headline}</h4>
                <div className="text-sm text-muted-foreground leading-relaxed ai-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderedReasoning }} />
            </div>

            {/* Display Job Context Snippet if available */}
            {jobContext && (
                <div className="mb-6 p-3 bg-muted/30 rounded-md border border-border/50 text-xs text-muted-foreground">
                    <p className="font-medium mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
                        Using Job Context
                    </p>
                    <p className="line-clamp-2 opacity-80 italic">
                        {jobContext}
                    </p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-6">
                {data.matched_entities?.map((match: any, i) => {
                    const matchText = typeof match === 'string'
                        ? match
                        : (match.experience || match.title || match.relevance || JSON.stringify(match));

                    return (
                        <div key={i} className="group relative flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border px-3 py-1.5 text-sm transition-colors rounded-md">
                            <span>{matchText}</span>
                            <button
                                onClick={() => onRemoveMatch && onRemoveMatch(matchText)}
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                title="Remove"
                            >
                                <X size={14} weight="bold" />
                            </button>
                        </div>
                    );
                })}

                {/* Dropdown for Adding Matches */}
                <div className="relative">
                    <select
                        className="bg-transparent border-b border-border focus:border-foreground outline-none px-2 py-1 text-sm w-48 transition-colors cursor-pointer"
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAdd(e.target.value);
                                e.target.value = ""; // Reset
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>+ Add experience</option>
                        {allowedMatches
                            .filter(m => !data.matched_entities?.includes(m))
                            .map((company, idx) => (
                                <option key={idx} value={company}>{company}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
        </section>
    );
}
