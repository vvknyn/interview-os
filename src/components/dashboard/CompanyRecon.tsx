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
        <section className="animate-in fade-in">
            <div className="mb-4">
                <h2 className="text-lg font-bold tracking-tight mb-1">{data.name}</h2>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
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

            <div className="mt-4 pt-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Job Posting URL (Context Only)
                </label>
                <input
                    type="url"
                    placeholder="Paste job posting URL..."
                    className="w-full text-xs bg-background border border-input rounded-md px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    value={jobUrl || ""}
                    onChange={(e) => onJobUrlChange?.(e.target.value)}
                    onBlur={() => onJobUrlChange?.(jobUrl || "")} // Optional trigger
                />
            </div>
        </section >
    );
}
