import Image from "next/image";
import { Brain, Gear, SignOut, DownloadSimple, MagnifyingGlass, WarningCircle, Eraser, FileText, Briefcase, ArrowsClockwise, User } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardEvent, useState } from "react";
import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { AuthPopover } from "@/components/auth/auth-popover";
import { NavMenu } from "@/components/layout/NavMenu";
import { ModelSwitcher } from "@/components/dashboard/ModelSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
  onReset?: () => void;
  error?: string | null;
  company?: string;
  position?: string;
  round?: string;
  user: SupabaseUser | null;
  showSearch?: boolean;
  title?: string;
  onOpenSidebar?: () => void;
  // Model switcher props
  modelProvider?: 'groq' | 'gemini' | 'openai';
  modelId?: string;
  onModelChange?: (provider: 'groq' | 'gemini' | 'openai', modelId: string) => void;
  apiKeys?: { groq?: string; gemini?: string; openai?: string };
  onConfigureKey?: (provider: 'groq' | 'gemini' | 'openai') => void;
  // Regenerate all prop
  onRegenerateAll?: () => void;
  isRegeneratingAll?: boolean;
}

export function Header({
  searchQuery = "",
  setSearchQuery = () => { },
  onAnalyze = () => { },
  isAnalyzing = false,
  onExportPDF,
  isExportingPDF,
  onReset,
  error,
  company,
  position,
  round,
  user,
  showSearch = true,
  title,
  onOpenSidebar,
  modelProvider,
  modelId,
  onModelChange,
  apiKeys,
  onConfigureKey,
  onRegenerateAll,
  isRegeneratingAll = false
}: HeaderProps) {
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onReset) {
      e.preventDefault();
      onReset();
    }
  };
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
        {/* Mobile Menu Button */}
        {onOpenSidebar && (
          <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-muted-foreground" onClick={onOpenSidebar}>
            <div className="space-y-1.5 ">
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
            </div>
          </Button>
        )}

        {/* Logo removed - AppShell sidebar provides the logo */}

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
              className="h-10 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-sm font-medium shrink-0"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Analyzing</span>
                </div>
              ) : (
                "Analyze"
              )}
            </Button>
          </>
        )}

        {/* Actions - Reordered for better UX */}
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Contextual Actions - Expandable on hover */}
          {onReset && (
            <button
              onClick={onReset}
              className="group hidden md:inline-flex items-center h-9 px-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              title="Start Over"
            >
              <Eraser size={18} weight="regular" className="shrink-0" />
              <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">Clear</span>
              </span>
            </button>
          )}

          {onRegenerateAll && (
            <button
              onClick={onRegenerateAll}
              disabled={isRegeneratingAll}
              className="group inline-flex items-center h-9 px-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
              title="Regenerate All Content"
            >
              {isRegeneratingAll ? (
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin shrink-0"></div>
              ) : (
                <ArrowsClockwise size={18} weight="bold" className="shrink-0" />
              )}
              <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">Regenerate</span>
              </span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="group inline-flex items-center h-9 px-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
              title="Export PDF"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin shrink-0"></div>
              ) : (
                <DownloadSimple size={18} weight="regular" className="shrink-0" />
              )}
              <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">PDF</span>
              </span>
            </button>
          )}

          <div className="h-4 w-px bg-border mx-1"></div>

          {/* Model Switcher (only show if props provided) */}
          {modelProvider && modelId && onModelChange && (
            <>
              <ModelSwitcher
                provider={modelProvider}
                model={modelId}
                onModelChange={onModelChange}
                apiKeys={apiKeys}
                onConfigureKey={onConfigureKey}
              />
              <div className="h-4 w-px bg-border mx-1"></div>
            </>
          )}

          {/* Main Menu (includes Auth & Navigation) */}
          <NavMenu
            user={user}
            onSignInClick={() => setAuthPopoverOpen(true)}
            onSignOut={handleSignOut}
          />

          <AuthPopover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen} showTrigger={false} />
        </div>
      </div>
    </header>
  );
}
