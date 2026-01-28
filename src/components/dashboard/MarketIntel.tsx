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
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Binoculars size={18} className="text-indigo-600" weight="fill" /> Market Intel
            </h3>

            <div className="space-y-4">
                {/* Business Model */}
                <div className="card-premium p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <Money size={16} weight="fill" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Business Model</h4>
                    </div>
                    <div
                        className="text-xs text-slate-600 leading-relaxed ai-content"
                        dangerouslySetInnerHTML={{ __html: renderedModel }}
                    />
                </div>

                {/* Competitors */}
                <div className="card-premium p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
                            <Sword size={16} weight="fill" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Competition</h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {competitors && competitors.length > 0 ? (
                            competitors.map((comp, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-md bg-slate-50 text-slate-700 font-semibold border border-slate-200 text-xs hover:bg-white hover:shadow-sm hover:border-orange-200 transition-all cursor-default">
                                    {comp}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-400 italic text-xs">No data.</span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
