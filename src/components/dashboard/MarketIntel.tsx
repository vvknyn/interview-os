import { Money, Sword, Binoculars } from "@phosphor-icons/react";
import MarkdownIt from "markdown-it";
import { useMemo } from "react";

const md = new MarkdownIt();

interface MarketIntelProps {
    businessModel?: string;
    competitors?: string[];
}

export function MarketIntel({ businessModel, competitors = [] }: MarketIntelProps) {
    const renderedModel = useMemo(() => md.render(businessModel || ""), [businessModel]);

    return (
        <section className="animate-in delay-200 space-y-4">
            <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-2">
                <Binoculars size={18} className="text-brand" weight="fill" /> Market Intel
            </h3>

            <div className="space-y-4">
                {/* Business Model */}
                <div className="bg-card border-border rounded-xl border p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-secondary text-brand border-border flex h-8 w-8 items-center justify-center rounded-full border">
                            <Money size={16} weight="fill" />
                        </div>
                        <h4 className="text-foreground text-sm font-bold">Business Model</h4>
                    </div>
                    <div
                        className="text-muted-foreground text-xs leading-relaxed ai-content"
                        dangerouslySetInnerHTML={{ __html: renderedModel }}
                    />
                </div>

                {/* Competitors */}
                <div className="bg-card border-border rounded-xl border p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-secondary text-brand border-border flex h-8 w-8 items-center justify-center rounded-full border">
                            <Sword size={16} weight="fill" />
                        </div>
                        <h4 className="text-foreground text-sm font-bold">Competition</h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {competitors && competitors.length > 0 ? (
                            competitors.map((comp, i) => (
                                <span key={i} className="bg-secondary text-muted-foreground border-border hover:bg-secondary/80 flex cursor-default rounded-md border px-3 py-1.5 text-xs font-semibold transition-all">
                                    {comp}
                                </span>
                            ))
                        ) : (
                            <span className="text-muted-foreground text-xs italic">No data.</span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
