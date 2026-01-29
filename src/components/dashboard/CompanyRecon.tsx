import { Newspaper, ChartLineUp } from "@phosphor-icons/react";
import { CompanyReconData } from "@/types";
import MarkdownIt from "markdown-it";
import { useMemo } from "react";

const md = new MarkdownIt();

interface CompanyReconProps {
    data: CompanyReconData;
    jobUrl?: string;
    onJobUrlChange?: (url: string) => void;
}

export function CompanyRecon({ data, jobUrl, onJobUrlChange }: CompanyReconProps) {
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

            <div className="mt-4 pt-4 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Job Posting URL (Context Only)
                </label>
                <input
                    type="url"
                    placeholder="Paste job posting URL..."
                    className="w-full text-xs bg-secondary/50 border border-border rounded px-2 py-1.5 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
                    value={jobUrl || ""}
                    onChange={(e) => onJobUrlChange?.(e.target.value)}
                    onBlur={() => onJobUrlChange?.(jobUrl || "")} // Optional trigger
                />
            </div>
        </section >
    );
}
