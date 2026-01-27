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
        <section className="animate-in delay-100">
            <div className="card-premium overflow-hidden group">
                <div className="p-8 md:p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">

                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase border border-white/10 text-indigo-100">
                                    {data.ticker || "N/A"}
                                </span>
                                <span className="text-sm text-indigo-200 font-medium tracking-wide flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                    {data.industry || "Tech"}
                                </span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-50 to-indigo-100">
                                {data.name}
                            </h2>

                            <div
                                className="text-slate-300 text-[15px] leading-7 max-w-3xl ai-content font-light tracking-wide"
                                dangerouslySetInnerHTML={{ __html: renderedDesc }}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:flex md:flex-col gap-3 w-full md:w-auto min-w-[160px]">
                            <a
                                href={`https://news.google.com/search?q=${data.name}`}
                                target="_blank"
                                rel="noreferrer"
                                className="group/btn relative bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-3 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10"
                            >
                                <Newspaper size={18} className="text-indigo-300 group-hover/btn:text-white transition-colors" />
                                <span>Live News</span>
                            </a>
                            <a
                                href={`https://www.google.com/search?q=${data.name}+stock`}
                                target="_blank"
                                rel="noreferrer"
                                className="group/btn relative bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-3 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10"
                            >
                                <ChartLineUp size={18} className="text-emerald-300 group-hover/btn:text-white transition-colors" />
                                <span>Stock Data</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="bg-slate-50/50 backdrop-blur-sm border-t border-slate-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interview Vibe</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm">
                            {data.vibe || "Professional"}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
