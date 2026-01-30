import { Brain, Gear, SignOut, DownloadSimple, MagnifyingGlass, WarningCircle, Eraser, FileText, Briefcase, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardEvent, useState } from "react";
import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { AuthPopover } from "@/components/auth/auth-popover";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onReset?: () => void;
  error?: string | null;
  company?: string;
  position?: string;
  round?: string;
  user: SupabaseUser | null;
  showSearch?: boolean;
  title?: string;
}

export function Header({
  searchQuery = "",
  setSearchQuery = () => { },
  onAnalyze = () => { },
  isAnalyzing = false,
  onExportPDF,
  isExportingPDF = false,
  onRefresh,
  isRefreshing = false,
  onReset,
  error,
  company,
  position,
  round,
  user,
  showSearch = true,
  title
}: HeaderProps) {
  const router = useRouter();
  const [authPopoverOpen, setAuthPopoverOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAnalyze();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          onClick={onReset}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer shrink-0"
        >
          <Brain size={20} weight="regular" className="text-foreground" />
          <span className="font-medium text-sm hidden sm:inline">Vela</span>
        </Link>

        {title && !showSearch && (
          <div className="flex-1 ml-4">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <>
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
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
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
          </>
        )}

        {/* Actions - Reordered for better UX */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Navigation Links First */}
          <Link href="/resume-builder">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-3 text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              title="Resume Builder"
            >
              <FileText size={18} weight="regular" />
              <span className="text-sm">Resume Builder</span>
            </Button>
          </Link>

          <Link href="/applications">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-3 text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              title="Application Tracker"
            >
              <Briefcase size={18} weight="regular" />
              <span className="text-sm">Applications</span>
            </Button>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Action Buttons */}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 px-3 text-muted-foreground hover:text-foreground hidden md:flex items-center gap-1.5"
              title="Clear search and start over"
            >
              <Eraser size={18} weight="regular" />
              <span className="text-sm">Start Over</span>
            </Button>
          )}

          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Refresh Data"
            >
              {isRefreshing ? (
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ArrowsClockwise size={20} weight="regular" />
              )}
            </Button>
          )}

          {onExportPDF && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Export to PDF"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <DownloadSimple size={20} weight="regular" />
              )}
            </Button>
          )}

          {user ? (
            <>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                  <Gear size={18} weight="regular" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <SignOut size={18} weight="regular" />
              </Button>
            </>
          ) : (
            <AuthPopover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen} />
          )}
        </div>
      </div>
    </header>
  );
}
