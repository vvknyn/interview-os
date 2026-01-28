"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Clock, MagnifyingGlass, CaretRight } from "@phosphor-icons/react";
import { getSuggestions, SearchSuggestion } from "@/lib/search-suggestions";
import { cn } from "@/lib/utils";

interface SearchAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string; // Class for the Input
    containerClassName?: string;
    autoFocus?: boolean;
}

export function SearchAutocomplete({
    value,
    onChange,
    onSearch,
    placeholder,
    disabled,
    className,
    containerClassName,
    autoFocus
}: SearchAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [history, setHistory] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load history
    useEffect(() => {
        const saved = localStorage.getItem("interview-os-recent-searches");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, []);

    // Update suggestions
    useEffect(() => {
        if (!isOpen) return; // Optimization
        if (value.trim() === "") {
            setSuggestions(history.slice(0, 5).map(h => ({ text: h, type: 'history' })));
        } else {
            setSuggestions(getSuggestions(value, history));
        }
    }, [value, history, isOpen]);

    // Click outside
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
        // Bubble up arrow keys only if dropdown is open and has items
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && isOpen && suggestions.length > 0) {
            e.preventDefault();
            if (e.key === "ArrowDown") {
                setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            } else {
                setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
            }
        } else if (e.key === "Enter") {
            if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault();
                handleSelect(suggestions[activeIndex].text);
            } else {
                setIsOpen(false);
                onSearch();
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (text: string) => {
        onChange(text);
        setIsOpen(false);

        // Update history immediately so it feels responsive
        const newHistory = [text, ...history.filter(h => h !== text)].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem("interview-os-recent-searches", JSON.stringify(newHistory));

        // Wait a tick for state to update then search
        setTimeout(() => onSearch(), 0);
    };

    return (
        <div className={cn("relative group", containerClassName)} ref={containerRef}>
            <MagnifyingGlass
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-30 pointer-events-none"
                weight="regular"
            />
            <Input
                type="text"
                placeholder={placeholder}
                className={cn("pl-12 pr-4 relative z-20 transition-all", className)}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                autoFocus={autoFocus}
            />

            {/* Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <ul className="py-2 max-h-[300px] overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className={cn(
                                    "px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors text-sm",
                                    index === activeIndex ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                                onClick={() => handleSelect(suggestion.text)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                {suggestion.type === 'history' ? (
                                    <Clock size={16} className="shrink-0 opacity-70" />
                                ) : (
                                    <MagnifyingGlass size={16} className="shrink-0 opacity-70" />
                                )}
                                <span className="flex-1 truncate">
                                    {suggestion.text}
                                </span>
                                {index === activeIndex && (
                                    <CaretRight size={14} className="opacity-50" />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
