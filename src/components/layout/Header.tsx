"use client";

import { Brain, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyboardEvent } from "react";

interface HeaderProps {
  company: string;
  setCompany: (value: string) => void;
  round: string;
  setRound: (value: string) => void;
  onAnalyze: () => void;
  onDataClick: () => void;
  isAnalyzing: boolean;
}

export function Header({
  company,
  setCompany,
  round,
  setRound,
  onAnalyze,
  onDataClick,
  isAnalyzing
}: HeaderProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAnalyze();
    }
  };

  /* Rolling Placeholder Logic */
  const placeholders = ["Airbnb", "Datadog", "Netflix", "Stripe", "Uber", "Amazon"];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadeProp, setFadeProp] = useState({ opacity: 1 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPlaceholder = `Target Company (e.g. ${placeholders[placeholderIndex]})...`;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-indigo-50/50 py-3 px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">

        {/* LOGO (Compact) */}
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Brain size={18} weight="fill" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Insight</span>
        </div>

        {/* SEARCH BAR (Results Mode) */}
        <div className="flex-1 w-full max-w-3xl mx-auto flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/80 border border-slate-200 rounded-full px-4 h-11 hover:shadow-md hover:border-indigo-300 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
            <MagnifyingGlass size={18} className="text-slate-400" />
            <Input
              type="text"
              className="flex-1 border-none shadow-none focus-visible:ring-0 h-9 p-0 text-slate-700 font-medium placeholder:text-slate-400 bg-transparent"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search company..."
            />
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <Select value={round} onValueChange={setRound}>
              <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0 h-9 p-0 bg-transparent text-slate-600 font-medium text-xs hover:bg-slate-50/50 rounded-sm">
                <SelectValue placeholder="Round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr">HR Screening</SelectItem>
                <SelectItem value="technical">Technical Deep Dive</SelectItem>
                <SelectItem value="manager">Hiring Manager</SelectItem>
                <SelectItem value="roleplay">Role Play Simulation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            size="icon"
            className="h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            {isAnalyzing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <MagnifyingGlass size={20} weight="bold" />}
          </Button>
        </div>

        {/* SETTINGS (Right) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDataClick}
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full w-10 h-10 transition-all"
        >
          <Gear size={22} weight="fill" />
        </Button>
      </div>
    </header>
  );
}
