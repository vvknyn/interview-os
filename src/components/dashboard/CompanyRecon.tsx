import { Newspaper, ChartLineUp } from "@phosphor-icons/react";
import { CompanyReconData } from "@/types";
import MarkdownIt from "markdown-it";
import { useMemo } from "react";

const md = new MarkdownIt();

interface CompanyReconProps {
    data: CompanyReconData;
}

export function CompanyRecon({ data }: CompanyReconProps) {
    const renderedDesc = useMemo(() => md.render(data.description || ""), [data.description]);

    return (
        <section className="animate-in delay-100 mb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl">

                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold text-white backdrop-blur-sm border border-white/10">
                            {data.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold leading-tight">{data.name}</h2>
                            <div className="flex items-center gap-2 text-xs text-indigo-200">
                                <span>{data.ticker || "N/A"}</span>
                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                <span>{data.industry || "Tech"}</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="text-slate-300 text-xs leading-5 ai-content font-light tracking-wide mb-6 line-clamp-[10]"
                        dangerouslySetInnerHTML={{ __html: renderedDesc }}
                    />

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <a
                            href={`https://news.google.com/search?q=${data.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        >
                            <Newspaper size={14} className="text-indigo-300" />
                            <span>News</span>
                        </a>
                        <a
                            href={`https://www.google.com/search?q=${data.name}+stock`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        >
                            <ChartLineUp size={14} className="text-emerald-300" />
                            <span>Stock</span>
                        </a>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vibe</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-bold border border-indigo-500/30">
                            {data.vibe || "Professional"}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
