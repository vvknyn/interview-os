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
        <section className="animate-in fade-in pt-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Microphone size={20} weight="fill" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Match Strategy</h2>
                    <p className="text-sm text-muted-foreground">Your pitch, tailored to the role</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Meta & Controls - Stacked Top */}
                <div className="space-y-8">
                    {/* Headline - Clean Typography */}
                    <div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">
                            Core Theme
                        </span>
                        <p className="font-medium text-xl md:text-2xl leading-relaxed text-foreground/90">
                            {data.headline}
                        </p>
                    </div>

                    {/* Experiences - Minimal list */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                Key Experiences
                            </span>
                            {!isRegenerating && onRegenerate && (
                                <button
                                    onClick={onRegenerate}
                                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
                                >
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <ArrowsClockwise size={12} />
                                        <span>Regenerate Headline</span>
                                    </span>
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(data.matched_entities || []).map((match, i) => (
                                <div
                                    key={i}
                                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted/30 hover:bg-muted/60 text-foreground/80 rounded-full transition-all cursor-default"
                                >
                                    <span className="font-medium">{match}</span>
                                    <button
                                        onClick={() => onRemoveMatch?.(match)}
                                        disabled={isRegenerating}
                                        className="text-muted-foreground/50 hover:text-destructive transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={10} weight="bold" />
                                    </button>
                                </div>
                            ))}

                            {/* Add Input - Minimal */}
                            <div className="relative inline-flex items-center">
                                <div className="flex items-center h-7 bg-transparent px-2 transition-all w-full group">
                                    <Plus size={12} className="text-muted-foreground/50 group-hover:text-primary transition-colors mr-1.5" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Add..."
                                        value={newCompany}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => setShowDropdown(true)}
                                        disabled={isRegenerating}
                                        className="text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/40 w-24 p-0 focus:ring-0"
                                    />
                                </div>
                                {allowedMatches.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="ml-1 text-muted-foreground/50 hover:text-foreground transition-colors p-1"
                                    >
                                        <CaretDown size={12} />
                                    </button>
                                )}

                                {/* Dropdown */}
                                {showDropdown && suggestions.length > 0 && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute top-8 left-0 z-20 bg-popover text-popover-foreground border border-border/20 rounded-lg shadow-xl py-1 min-w-[180px] max-h-[200px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                                    >
                                        {suggestions.map((company, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAddCompany(company)}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${idx === highlightedIndex
                                                    ? 'bg-primary/5 text-primary'
                                                    : 'hover:bg-muted/50'
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

                {/* Script Content - Stacked Below */}
                <div className={`pt-4 ${isRegenerating ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isRegenerating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary bg-background px-4 py-2 rounded-full shadow-lg">
                                <ArrowsClockwise size={16} className="animate-spin" />
                                Regenerating Script...
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                            Suggested Answer
                        </h3>
                    </div>

                    <div className="prose prose-base max-w-none 
                        prose-p:text-foreground/90 prose-p:leading-8 prose-p:mb-6
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-ul:my-4 prose-ul:pl-5 
                        prose-li:text-foreground/80 prose-li:my-2
                        leading-relaxed font-sans"
                    >
                        <div dangerouslySetInnerHTML={{ __html: renderedReasoning }} />
                    </div>
                </div>
            </div >
        </section >
    );
}
