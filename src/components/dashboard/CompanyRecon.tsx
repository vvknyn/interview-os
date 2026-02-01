// This component is now rendered inside DashboardSidebar as a direct child, 
// or passed as a prop. But based on the request, CompanyRecon is part of the layout.
// Actually, looking at DashboardContainer, CompanyRecon is passed to DashboardSidebar.
// The Sidebar handles the layout for it. 
// However, the user wants a UNIFIED design. 
// If CompanyRecon is in the sidebar, it might not need the huge header like the main content.
// BUT, looking at the code, CompanyRecon HAS a header: "Google", "Tickers".
// Let's standardise the internal content spacing at least, even if we don't use DashboardSection wrapping (since it's in a sidebar).
// WAIT. The prompt says "Refactor CompanyRecon to use DashboardSection". 
// But CompanyRecon is in the sidebar. The sidebar might constrain width.
// Let's assume the user might want it to look consistent even there, OR they might move it.
// Let's check where it is used. It is used in DashboardSidebar's `bottomContent`.
// The Sidebar probably renders it directly.
// Let's stick to the styling requests: "Make sure a common styling template is used".
// If I wrap it in DashboardSection, it will get the big header.
// In the sidebar, a big header "Company Recon" might be too much if it already says "Google".
// Let's actually look at CompanyRecon.tsx again. It shows "Google" as H2.
// Let's use DashboardSection but maybe with smaller icon/text if needed, OR just keep the internal styling clean.
// Actually, for CompanyRecon, the "Title" is the Company Name.
// Let's Use DashboardSection, passing the company name as Title.

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
            <span>{data.ticker || "Private"}</span>
            {data.industry && (
                <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{data.industry}</span>
                </>
            )}
            {data.vibe && (
                <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{data.vibe}</span>
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
                    className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors flex items-center gap-1"
                >
                    Latest News
                </a>
                <span className="text-muted-foreground/30">|</span>
                <a
                    href={`https://www.google.com/search?q=${data.name}+stock`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors flex items-center gap-1"
                >
                    Stock Performance
                </a>
            </div>

            <div className="pt-4 border-t border-border/40">
                <label className="text-[10px] items-center gap-1.5 uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 flex">
                    Context URL
                </label>
                <input
                    type="url"
                    placeholder="Paste job posting URL..."
                    className="w-full text-xs bg-muted/40 border border-transparent hover:border-border rounded-lg px-3 py-2.5 placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 transition-all shadow-sm"
                    value={jobUrl || ""}
                    onChange={(e) => onJobUrlChange?.(e.target.value)}
                    onBlur={() => onJobUrlChange?.(jobUrl || "")}
                />
            </div>
        </DashboardSection>
    );
}
