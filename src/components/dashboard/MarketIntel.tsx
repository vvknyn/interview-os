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
        <section className="animate-in delay-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Binoculars size={22} className="text-indigo-600" weight="fill" /> Market Intelligence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Model */}
                <div className="card-premium p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <Money size={20} weight="fill" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Business Model</h4>
                    </div>
                    <div
                        className="text-sm text-slate-600 leading-relaxed ai-content"
                        dangerouslySetInnerHTML={{ __html: renderedModel }}
                    />
                </div>

                {/* Competitors */}
                <div className="card-premium p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
                            <Sword size={20} weight="fill" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Competitive Landscape</h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {competitors && competitors.length > 0 ? (
                            competitors.map((comp, i) => (
                                <span key={i} className="px-4 py-2 rounded-lg bg-slate-50 text-slate-700 font-semibold border border-slate-200 text-sm hover:bg-white hover:shadow-sm hover:border-orange-200 transition-all cursor-default">
                                    {comp}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-400 italic text-sm">No competitors analyzed yet.</span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
