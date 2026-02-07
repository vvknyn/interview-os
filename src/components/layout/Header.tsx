import { DownloadSimple, MagnifyingGlass, WarningCircle, Eraser, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardEvent, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { AuthPopover } from "@/components/auth/auth-popover";
import { NavMenu } from "@/components/layout/NavMenu";
import { ModelSwitcher } from "@/components/dashboard/ModelSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PrepSettings, QuestionSettings } from "@/components/dashboard/PrepSettings";

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
  modelProvider?: 'groq' | 'gemini' | 'openai';
  modelId?: string;
  onModelChange?: (provider: 'groq' | 'gemini' | 'openai', modelId: string) => void;
  apiKeys?: { groq?: string; gemini?: string; openai?: string };
  onConfigureKey?: (provider: 'groq' | 'gemini' | 'openai') => void;
  onRegenerateAll?: () => void;
  isRegeneratingAll?: boolean;
  prepSettings?: QuestionSettings;
  onPrepSettingsChange?: (settings: QuestionSettings) => void;
  // Job Context
  jobUrl?: string;
  onJobUrlChange?: (url: string) => void;
  jobContext?: string;
  onJobContextChange?: (context: string) => void;
  isFetchingJob?: boolean;
  onFetchJobContext?: () => void;
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
  isRegeneratingAll = false,
  prepSettings,
  onPrepSettingsChange,
  jobUrl,
  onJobUrlChange,
  jobContext,
  onJobContextChange,
  isFetchingJob,
  onFetchJobContext
}: HeaderProps) {
  const router = useRouter();
  const [authPopoverOpen, setAuthPopoverOpen] = useState(false);

  const handleSignOut = async () => {
    localStorage.clear();
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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl shadow-[var(--shadow-sm)]">
      <div className="px-4 h-16 flex items-center gap-4">
        {/* Mobile Menu Button */}
        {onOpenSidebar && (
          <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-muted-foreground" onClick={onOpenSidebar}>
            <div className="space-y-1.5">
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
            </div>
          </Button>
        )}

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
                  className="h-11 pl-10 pr-10 text-sm bg-muted/30 focus-visible:bg-muted/50 transition-all duration-150 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Google, Software Engineer..."
                />
                {prepSettings && onPrepSettingsChange && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <PrepSettings
                      settings={prepSettings}
                      onChange={onPrepSettingsChange}
                      jobUrl={jobUrl || ""}
                      onJobUrlChange={onJobUrlChange || (() => { })}
                      jobContext={jobContext || ""}
                      onJobContextChange={onJobContextChange || (() => { })}
                      isFetchingJob={isFetchingJob || false}
                      onFetchJobContext={onFetchJobContext || (() => { })}
                    />
                  </div>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                  <WarningCircle size={14} weight="fill" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              variant="brand"
              size="lg"
              className="h-11 px-5 text-sm font-medium shrink-0"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-brand-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Analyzing</span>
                </div>
              ) : (
                "Analyze"
              )}
            </Button>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {onReset && (
            <button
              onClick={onReset}
              className="group hidden md:inline-flex items-center h-9 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
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
              className="group inline-flex items-center h-9 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 disabled:opacity-50"
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
              className="group inline-flex items-center h-9 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 disabled:opacity-50"
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

          <div className="h-4 w-px bg-muted-foreground/15 mx-1"></div>

          {/* Model Switcher */}
          {modelProvider && modelId && onModelChange && (
            <>
              <ModelSwitcher
                provider={modelProvider}
                model={modelId}
                onModelChange={onModelChange}
                apiKeys={apiKeys}
                onConfigureKey={onConfigureKey}
              />
              <div className="h-4 w-px bg-muted-foreground/15 mx-1"></div>
            </>
          )}

          {/* Main Menu */}
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
