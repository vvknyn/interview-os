import { Brain, Gear, SignOut, DownloadSimple, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardEvent } from "react";
import { signOut } from "@/actions/auth";
import Link from "next/link";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
  onReset?: () => void;
  error?: string | null;
  company?: string;
  position?: string;
  round?: string;
}

export function Header({
  searchQuery,
  setSearchQuery,
  onAnalyze,
  isAnalyzing,
  onExportPDF,
  isExportingPDF = false,
  onReset,
  error,
  company,
  position,
  round
}: HeaderProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAnalyze();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            onClick={onReset || (() => window.location.reload())}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer shrink-0"
          >
            <Brain size={20} weight="regular" className="text-foreground" />
            <span className="font-medium text-sm hidden sm:inline">InterviewOS</span>
          </div>

          {/* Search Bar - Same as home page */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                weight="regular"
              />
              <Input
                type="text"
                className="h-10 pl-10 pr-4 text-sm border-border/50 focus-visible:border-foreground bg-transparent transition-colors w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Google, Software Engineer..."
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <WarningCircle size={14} weight="fill" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            size="sm"
            className="h-10 px-4 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium shrink-0"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-background border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Analyzing</span>
              </div>
            ) : (
              "Analyze"
            )}
          </Button>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
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

        {/* Current search context display */}
        {company && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{company}</span>
            {position && <span>•</span>}
            {position && <span>{position}</span>}
            {round && <span>•</span>}
            {round && <span className="capitalize">{round}</span>}
          </div>
        )}
      </div>
    </header>
  );
}
