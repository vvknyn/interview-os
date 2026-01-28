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
        <section className="animate-in fade-in pt-8 border-t border-border">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">{data.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {data.ticker && <span>{data.ticker}</span>}
                    {data.ticker && data.industry && <span>·</span>}
                    {data.industry && <span>{data.industry}</span>}
                    {data.vibe && (
                        <>
                            <span>·</span>
                            <span>{data.vibe}</span>
                        </>
                    )}
                </div>
            </div>

            <div
                className="text-sm text-muted-foreground mb-6 leading-relaxed ai-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedDesc }}
            />

            <div className="flex gap-2">
                <a
                    href={`https://news.google.com/search?q=${data.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                    News
                </a>
                <span className="text-muted-foreground">·</span>
                <a
                    href={`https://www.google.com/search?q=${data.name}+stock`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                    Stock
                </a>
            </div>
        </section>
    );
}
