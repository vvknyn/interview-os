import { X, Plus, ArrowsClockwise, Microphone, CaretDown } from "@phosphor-icons/react";
import { MatchData } from "@/types";
import { useMemo, useState, KeyboardEvent, useRef, useEffect } from "react";
import MarkdownIt from "markdown-it";
import { Input } from "@/components/ui/input";

const md = new MarkdownIt();

interface MatchSectionProps {
    data: MatchData;
    onAddMatch?: (match: string) => void;
    onRemoveMatch?: (match: string) => void;
    allowedMatches?: string[];
    jobContext?: string;
    isRegenerating?: boolean;
    onRegenerate?: () => void;
}

export function MatchSection({
    data,
    onAddMatch,
    onRemoveMatch,
    allowedMatches = [],
    jobContext,
    isRegenerating = false,
    onRegenerate
}: MatchSectionProps) {
    const renderedReasoning = useMemo(() => md.render(data.reasoning || ""), [data.reasoning]);
    const [newCompany, setNewCompany] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const suggestions = useMemo(() => {
        const currentEntities = data.matched_entities || [];
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

        // Strict validation: must be in allowedMatches if provided
        if (allowedMatches.length > 0 && !allowedMatches.includes(toAdd)) {
            // Optional: Show error or shake effect? For now, just ignore or maybe clear if invalid
            // check case insensitive
            const match = allowedMatches.find(m => m.toLowerCase() === toAdd.toLowerCase());
            if (!match) {
                return; // Invalid company
            }
            // use the casing from allowedMatches
            if (data.matched_entities?.includes(match)) {
                setNewCompany("");
                setShowDropdown(false);
                return;
            }
            onAddMatch?.(match);
        } else {
            // Fallback if no allowedMatches provided (though we expect them now)
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
        <section className="animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Microphone size={16} weight="fill" className="text-primary" />
                    </div>
                    <h2 className="text-base font-semibold">Tell Me About Yourself</h2>
                </div>
                <div className="flex items-center gap-2">
                    {!isRegenerating && onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors border border-transparent hover:border-border"
                            title="Regenerate Script"
                        >
                            <ArrowsClockwise size={13} />
                            <span>Regenerate</span>
                        </button>
                    )}
                    {isRegenerating && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ArrowsClockwise size={14} className="animate-spin" />
                            <span>Updating...</span>
                        </div>
                    )}
                </div>
            </div>
            {/* Script Content */}
            <div className={`relative transition-opacity ${isRegenerating ? 'opacity-50' : ''}`}>
                {/* Headline */}
                <div className="mb-3 px-3 py-2 bg-secondary/30 rounded-md border border-border">
                    <p className="text-sm font-medium">{data.headline}</p>
                </div>

                {/* Script */}
                <div className="px-3 py-3 bg-muted/20 rounded-md border border-border">
                    <div
                        className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-strong:text-foreground"
                        dangerouslySetInnerHTML={{ __html: renderedReasoning }}
                    />
                </div>
            </div>

            {/* Subtle Company Controls - Below Script */}
            <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Featuring:</span>

                    {/* Current Companies as small tags */}
                    {(data.matched_entities || []).map((match, i) => (
                        <button
                            key={i}
                            onClick={() => onRemoveMatch?.(match)}
                            disabled={isRegenerating}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-secondary/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 rounded transition-colors disabled:opacity-50"
                            title="Click to remove"
                        >
                            <span className="group-hover:text-destructive">{match}</span>
                            <X size={10} weight="bold" className="opacity-50 group-hover:opacity-100 group-hover:text-destructive" />
                        </button>
                    ))}

                    {/* Compact Add Input */}
                    <div className="relative">
                        <div className="flex items-center">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="+ Add company"
                                value={newCompany}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowDropdown(true)}
                                disabled={isRegenerating}
                                className="h-6 w-32 text-xs px-2 border-dashed"
                            />
                            {allowedMatches.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <CaretDown size={12} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown */}
                        {showDropdown && suggestions.length > 0 && (
                            <div
                                ref={dropdownRef}
                                className="absolute top-full left-0 mt-1 z-20 bg-background border border-border rounded-md shadow-lg py-1 min-w-[160px] max-h-[150px] overflow-y-auto"
                            >
                                {suggestions.map((company, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAddCompany(company)}
                                        className={`w-full text-left px-2 py-1.5 text-xs transition-colors ${idx === highlightedIndex
                                            ? 'bg-secondary text-foreground'
                                            : 'hover:bg-secondary/50'
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
        </section>
    );
}
