import { Gear, SignOut, WarningCircle, Clock, MagnifyingGlass, CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardEvent, useState, useEffect, useRef } from "react";
import { signOut } from "@/actions/auth";
import { getSuggestions, SearchSuggestion } from "@/lib/search-suggestions";

interface SearchHomeProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
    error?: string | null;
}

export function SearchHome({
    searchQuery,
    setSearchQuery,
    onAnalyze,
    isAnalyzing,
    error
}: SearchHomeProps) {
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [history, setHistory] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem("interview-os-recent-searches");
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse search history", e);
        }
        return [];
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Update suggestions when query changes
    // Update suggestions when query changes
    useEffect(() => {
        // Debounce or direct update? Direct reference fine effectively if history is stable.
        const timer = setTimeout(() => {
            if (searchQuery.trim() === "") {
                setSuggestions(history.slice(0, 5).map(h => ({ text: h, type: 'history' })));
            } else {
                setSuggestions(getSuggestions(searchQuery, history));
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [searchQuery, history]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Enter") {
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                handleSelect(suggestions[activeIndex].text);
            } else {
                handleAnalyze();
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (text: string) => {
        setSearchQuery(text);
        setIsOpen(false);
        // Trigger analysis after a short timeout to allow state update or call directly if parent handles it
        // But here we just set query, user might want to edit. 
        // Actually for autocomplete, usually selecting submits or fills. Let's fill and focus.
        // User asked for "Selects suggestion" on Enter.
        // Let's call analyze directly for smoother UX if it's a "full" suggestion?
        // For now, just fill and let user hit enter or click button, unless it was Enter key which usually submits.
        // But to be safe, let's just save history here if we were executing.
        // We will delegate execution to onAnalyze wrapper.
    };

    const handleAnalyze = () => {
        // Save to history
        if (searchQuery.trim()) {
            const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10);
            setHistory(newHistory);
            localStorage.setItem("interview-os-recent-searches", JSON.stringify(newHistory));
        }
        onAnalyze();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            {/* Top Right Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-1">
                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
                        title="Settings"
                    >
                        <Gear size={18} weight="regular" />
                    </Button>
                </Link>
                <form action={signOut}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                        title="Sign Out"
                    >
                        <SignOut size={18} weight="regular" />
                    </Button>
                </form>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-lg -mt-24">
                {/* Title */}
                <div className="mb-16 text-center">
                    <h1 className="text-[56px] font-semibold tracking-tighter leading-none mb-3">
                        Vela
                    </h1>
                    <p className="text-muted-foreground text-base">
                        Your job application workspace
                    </p>
                </div>

                {/* Search Input */}
                <div className="space-y-4 relative" ref={containerRef}>
                    <div className="group relative">
                        <Input
                            type="text"
                            placeholder="e.g. Google, Software Engineer, Technical Round"
                            className="h-14 text-base border-border/50 focus-visible:border-foreground bg-transparent px-4 transition-colors relative z-20"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsOpen(true);
                                setActiveIndex(-1);
                            }}
                            onFocus={() => setIsOpen(true)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />

                        {/* Autocomplete Dropdown */}
                        {isOpen && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <ul className="py-2">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${index === activeIndex ? "bg-muted" : "hover:bg-muted/50"
                                                }`}
                                            onClick={() => {
                                                handleSelect(suggestion.text);
                                                // If clicking, we typically fill. 
                                                // If users want to submit immediately, they can click "Start preparing"
                                            }}
                                        >
                                            {suggestion.type === 'history' ? (
                                                <Clock size={16} className="text-muted-foreground shrink-0" />
                                            ) : (
                                                <MagnifyingGlass size={16} className="text-muted-foreground shrink-0" />
                                            )}
                                            <span className="flex-1 truncate text-sm">
                                                {suggestion.text}
                                            </span>
                                            {index === activeIndex && (
                                                <CaretRight size={14} className="text-muted-foreground" />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="text-muted-foreground text-xs mt-2 px-1">
                            Tailor resumes, track applications, and prepare for interviews
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <WarningCircle size={18} weight="fill" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="h-12 w-full bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
                    >
                        {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border border-background border-t-transparent rounded-full animate-spin"></div>
                                Analyzing
                            </div>
                        ) : (
                            "Start preparing"
                        )}
                    </Button>
                </div>
            </div>

            {/* Footer hint */}
            <div className="absolute bottom-6 text-muted-foreground text-xs">
                Press <kbd className="px-1.5 py-0.5 border border-border rounded">Enter</kbd> to begin
            </div>
        </div>
    );
}
