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
  onReset?: () => void;
}

export function Header({
  company,
  setCompany,
  round,
  setRound,
  onAnalyze,
  isAnalyzing,
  onExportPDF,
  isExportingPDF = false,
  onReset
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm h-14 px-4 flex items-center">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <Brain size={20} weight="regular" className="text-foreground" />
          <span className="font-medium text-sm">InterviewOS</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md flex items-center gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" weight="regular" />
            <Input
              type="text"
              className="h-9 pl-9 pr-3 text-sm border-transparent focus-visible:border-border bg-transparent hover:bg-muted/50 focus-visible:bg-background transition-colors"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Company"
            />
          </div>
          <Select value={round} onValueChange={setRound}>
            <SelectTrigger className="w-32 h-9 border-transparent hover:bg-muted/50 bg-transparent text-xs text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="roleplay">Role Play</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            size="sm"
            className="h-9 px-3 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium"
          >
            {isAnalyzing ? (
              <div className="w-3.5 h-3.5 border border-background border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onExportPDF && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Export to PDF"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <DownloadSimple size={18} weight="regular" />
              )}
            </Button>
          )}
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Gear size={18} weight="regular" />
            </Button>
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" className="h-9 w-9 text-muted-foreground hover:text-destructive" title="Sign Out">
              <SignOut size={18} weight="regular" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
