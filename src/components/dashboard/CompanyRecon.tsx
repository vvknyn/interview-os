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
            <div className="bg-card text-card-foreground border-border relative overflow-hidden rounded-xl border p-6">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-secondary text-secondary-foreground border-border flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-bold">
                            {data.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold leading-tight">{data.name}</h2>
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <span>{data.ticker || "N/A"}</span>
                                <span className="bg-primary h-1 w-1 rounded-full"></span>
                                <span>{data.industry || "Tech"}</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="text-muted-foreground ai-content mb-6 line-clamp-[10] text-xs font-light leading-5 tracking-wide"
                        dangerouslySetInnerHTML={{ __html: renderedDesc }}
                    />

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <a
                            href={`https://news.google.com/search?q=${data.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-secondary hover:bg-secondary/80 border-border text-foreground flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                        >
                            <Newspaper size={14} className="text-muted-foreground" />
                            <span>News</span>
                        </a>
                        <a
                            href={`https://www.google.com/search?q=${data.name}+stock`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-secondary hover:bg-secondary/80 border-border text-foreground flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                        >
                            <ChartLineUp size={14} className="text-muted-foreground" />
                            <span>Stock</span>
                        </a>
                    </div>

                    <div className="border-border flex items-center justify-between border-t pt-4">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Vibe</span>
                        <span className="bg-secondary text-secondary-foreground border-border rounded-full border px-2 py-0.5 text-[10px] font-bold">
                            {data.vibe || "Professional"}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
