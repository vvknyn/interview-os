"use client";

import { Brain, MagnifyingGlass, Gear, SignOut, DownloadSimple } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import Link from "next/link";
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
import { signOut } from "@/actions/auth";

interface HeaderProps {
  company: string;
  setCompany: (value: string) => void;
  round: string;
  setRound: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
}

export function Header({
  company,
  setCompany,
  round,
  setRound,
  onAnalyze,
  isAnalyzing,
  onExportPDF,
  isExportingPDF = false
}: HeaderProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAnalyze();
    }
  };

  /* Rolling Placeholder Logic */
  const placeholders = ["Airbnb", "Datadog", "Netflix", "Stripe", "Uber", "Amazon"];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 border-b py-3 px-6 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">

        {/* LOGO (Compact) */}
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg shadow-none">
            <Brain size={18} weight="fill" />
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">Insight</span>
        </div>

        {/* SEARCH BAR (Results Mode) */}
        <div className="flex-1 w-full max-w-3xl mx-auto flex gap-2">
          <div className="bg-secondary border-border focus-within:ring-ring hover:border-primary/50 flex flex-1 items-center gap-2 rounded-full border px-4 h-11 transition-all focus-within:ring-2 focus-within:border-transparent">
            <MagnifyingGlass size={18} className="text-muted-foreground" />
            <Input
              type="text"
              className="text-foreground placeholder:text-muted-foreground flex-1 border-none bg-transparent h-9 p-0 font-medium shadow-none focus-visible:ring-0"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search company..."
            />
            <div className="bg-border h-4 w-px mx-1"></div>
            <Select value={round} onValueChange={setRound}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 text-muted-foreground hover:bg-transparent h-9 w-[140px] rounded-sm bg-transparent p-0 text-xs font-medium">
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-11 rounded-full shadow-none transition-all"
          >
            {isAnalyzing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <MagnifyingGlass size={20} weight="bold" />}
          </Button>
        </div>

        {/* SETTINGS & LOGOUT (Right) */}
        <div className="flex items-center gap-2">
          {onExportPDF && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full w-10 h-10 transition-all"
              title="Export to PDF"
            >
              {isExportingPDF ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground"></div>
              ) : (
                <DownloadSimple size={22} weight="bold" />
              )}
            </Button>
          )}

          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full w-10 h-10 transition-all"
            >
              <Gear size={22} weight="fill" />
            </Button>
          </Link>

          <form action={signOut}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-10 h-10 transition-all"
              title="Sign Out"
            >
              <SignOut size={22} weight="bold" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
