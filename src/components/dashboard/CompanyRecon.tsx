import { Newspaper } from "@phosphor-icons/react";
import { CompanyReconData } from "@/types";
import MarkdownIt from "markdown-it";
import { useMemo } from "react";
import { DashboardSection } from "./DashboardSection";

const md = new MarkdownIt();

interface CompanyReconProps {
    data: CompanyReconData;
    jobUrl?: string;
    onJobUrlChange?: (url: string) => void;
}

export function CompanyRecon({ data, jobUrl, onJobUrlChange }: CompanyReconProps) {
    const renderedDesc = useMemo(() => md.render(data.description || ""), [data.description]);

    const subtitle = (
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
            <span className="bg-muted/50 px-2 py-0.5 rounded-md">{data.ticker || "Private"}</span>
            {data.industry && (
                <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{data.industry}</span>
                </>
            )}
            {data.vibe && (
                <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-brand-muted">{data.vibe}</span>
                </>
            )}
        </div>
    );

    return (
        <DashboardSection
            title={data.name}
            subtitle={subtitle}
            titleClassName="text-lg font-bold"
            className="animate-in fade-in"
        >
            <div
                className="text-sm text-muted-foreground mb-6 leading-relaxed ai-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedDesc }}
            />

            <div className="flex gap-3 mb-6">
                <a
                    href={`https://news.google.com/search?q=${data.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand hover:underline underline-offset-4 transition-colors flex items-center gap-1"
                >
                    Latest News
                </a>
                <span className="text-border">|</span>
                <a
                    href={`https://www.google.com/search?q=${data.name}+stock`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand hover:underline underline-offset-4 transition-colors flex items-center gap-1"
                >
                    Stock Performance
                </a>
            </div>

            <div className="pt-4">
                <label className="text-[10px] items-center gap-1.5 uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 flex">
                    Context URL
                </label>
                <input
                    type="url"
                    placeholder="Paste job posting URL..."
                    className="w-full text-xs bg-muted/40 rounded-lg px-3 py-2.5 placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/10 transition-all"
                    value={jobUrl || ""}
                    onChange={(e) => onJobUrlChange?.(e.target.value)}
                    onBlur={() => onJobUrlChange?.(jobUrl || "")}
                />
            </div>
        </DashboardSection>
    );
}
