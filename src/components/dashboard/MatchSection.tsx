import { X, Plus, ArrowsClockwise, User, CaretDown } from "@phosphor-icons/react";
import { MatchData } from "@/types";
import { useMemo, useState, KeyboardEvent, useRef, useEffect } from "react";
import MarkdownIt from "markdown-it";
import { DashboardSection } from "./DashboardSection";
import { Button } from "@/components/ui/button";

const md = new MarkdownIt();

interface MatchSectionProps {
    data: MatchData;
    onAddMatch?: (match: string) => void;
    onRemoveMatch?: (match: string) => void;
    allowedMatches?: string[];
    jobContext?: string;
}

export function MatchSection({
    data,
    onAddMatch,
    onRemoveMatch,
    allowedMatches = []
}: MatchSectionProps) {
    const renderedReasoning = useMemo(() => md.render(data.reasoning || ""), [data.reasoning]);
    const [newCompany, setNewCompany] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const suggestions = useMemo(() => {
        const currentEntities = (data.matched_entities || []).map(e => typeof e === 'string' ? e : (e as any).name || (e as any).company_name || String(e));
        const available = allowedMatches.filter(m => !currentEntities.includes(m));

        if (!newCompany.trim()) return available;

        const lower = newCompany.toLowerCase();
        return available.filter(m => m.toLowerCase().includes(lower));
    }, [allowedMatches, data.matched_entities, newCompany]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddCompany = (company?: string) => {
        const toAdd = company || newCompany.trim();
        if (!toAdd) return;

        // Strict validation
        if (allowedMatches.length > 0 && !allowedMatches.includes(toAdd)) {
            const match = allowedMatches.find(m => m.toLowerCase() === toAdd.toLowerCase());
            if (!match) return;
            if (data.matched_entities?.includes(match)) {
                setNewCompany("");
                setShowDropdown(false);
                return;
            }
            onAddMatch?.(match);
        } else {
            if (data.matched_entities?.includes(toAdd)) {
                setNewCompany("");
                setShowDropdown(false);
                return;
            }
            onAddMatch?.(toAdd);
        }

        setNewCompany("");
        setShowDropdown(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                handleAddCompany(suggestions[highlightedIndex]);
            } else if (newCompany.trim()) {
                handleAddCompany();
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setShowDropdown(true);
            setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === "Escape") {
            setShowDropdown(false);
            setHighlightedIndex(-1);
        }
    };

    const handleInputChange = (value: string) => {
        setNewCompany(value);
        setShowDropdown(true);
        setHighlightedIndex(-1);
    };

    return (
        <DashboardSection
            title="Match Strategy"
            subtitle="Your tailored pitch based on key experiences"
            icon={User}
        >
            <div className="space-y-6">
                {/* Content Card */}
                <div className="relative">
                    <div className="bg-muted/10 p-6 md:p-8 rounded-xl shadow-[var(--shadow-sm)]">
                        {/* Headline inside card for alignment */}
                        <div className="mb-6">
                            <span className="text-[10px] uppercase tracking-widest text-brand/80 font-bold mb-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand" /> Core Theme
                            </span>
                            <p className="font-medium text-xl md:text-2xl leading-relaxed text-foreground tracking-tight max-w-4xl">
                                {data.headline}
                            </p>
                        </div>

                        {/* Script Content */}
                        <div className="prose prose-sm max-w-none 
                            prose-p:text-foreground/80 prose-p:leading-8 prose-p:mb-5 text-left
                            prose-strong:text-foreground prose-strong:font-semibold
                            prose-ul:my-4 prose-ul:pl-0 prose-ul:list-none
                            prose-li:text-foreground/80 prose-li:my-2 prose-li:pl-4 prose-li:border-l-2 prose-li:border-brand/20
                            font-sans"
                        >
                            <div dangerouslySetInnerHTML={{ __html: renderedReasoning }} />
                        </div>
                    </div>
                </div>

                {/* Experiences Tags - Moved to bottom for cleaner hierarchy */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            Included Experiences
                        </span>
                        <div className="h-px bg-muted-foreground/10 flex-1" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(data.matched_entities || []).map((match, i) => (
                            <div
                                key={i}
                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-all cursor-default shadow-sm"
                            >
                                <span className="font-medium">
                                    {typeof match === 'string' ? match : (match as any).name || (match as any).company_name || String(match)}
                                </span>
                                <button
                                    onClick={() => onRemoveMatch?.(match)}
                                    className="text-muted-foreground/50 hover:text-destructive transition-colors focus:outline-none opacity-0 group-hover:opacity-100 -mr-0.5"
                                >
                                    <X size={12} weight="bold" />
                                </button>
                            </div>
                        ))}

                        {/* Add Input */}
                        <div className="relative inline-flex items-center ml-1">
                            <div className="flex items-center h-7 bg-muted/20 hover:bg-muted/40 px-2.5 rounded-lg transition-all group cursor-text" onClick={() => inputRef.current?.focus()}>
                                <Plus size={12} className="text-muted-foreground/70 mr-1.5 group-hover:text-brand transition-colors" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Add experience..."
                                    value={newCompany}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setShowDropdown(true)}
                                    className="text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-28 p-0 focus:ring-0 cursor-text"
                                />
                                {allowedMatches.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDropdown(!showDropdown);
                                        }}
                                        className="ml-1 text-muted-foreground/30 hover:text-foreground transition-colors p-0.5"
                                    >
                                        <CaretDown size={10} weight="bold" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown */}
                            {showDropdown && suggestions.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-9 left-0 z-20 bg-popover text-popover-foreground rounded-lg shadow-xl py-1 min-w-[180px] max-h-[220px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                                >
                                    {suggestions.map((company, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAddCompany(company)}
                                            className={`w-full text-left px-3 py-2 text-xs transition-colors border-l-2 ${idx === highlightedIndex
                                                ? 'bg-brand/5 text-brand border-brand'
                                                : 'hover:bg-muted/50 border-transparent'
                                                }`}
                                        >
                                            {company}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardSection>
    );
}
