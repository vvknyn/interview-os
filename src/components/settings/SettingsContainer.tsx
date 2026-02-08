"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { StoryManager } from "@/components/dashboard/StoryManager";
import { fetchStories, saveStories } from "@/actions/save-story";
import { fetchProfile, updateModelSettings } from "@/actions/profile";
import { fetchSources } from "@/actions/sources";
import { SourcesManager } from "@/components/settings/SourcesManager";
import { ModelSettings, AVAILABLE_MODELS } from "@/components/settings/ModelSettings";
import { ArrowLeft, Palette, Check, DownloadSimple, Heart, Trash, CircleNotch, WarningOctagon } from "@phosphor-icons/react";
import { deleteAccount } from "@/actions/auth";
import { exportUserData } from "@/actions/account";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/providers/ThemeProvider";
import { themes, themeNames } from "@/lib/themes";
import Link from "next/link";
import { NavMenu } from "@/components/layout/NavMenu";
import { AuthPopover } from "@/components/auth/auth-popover";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { StarStory, SourceItem } from "@/types";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { getAppConfig } from "@/actions/admin";

export function SettingsContainer() {
    const { theme, setTheme: setThemeFn } = useTheme();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [authPopoverOpen, setAuthPopoverOpen] = useState(false);

    const [stories, setStories] = useState<StarStory[]>([]);
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState(AVAILABLE_MODELS.groq[0].id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'stories' | 'sources' | 'models' | 'appearance' | 'account'>('stories');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // App config (for donation feature flag)
    const [appConfig, setAppConfig] = useState<{ show_donation: boolean; donation_url: string } | null>(null);

    // Account management state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleSignOut = async () => {
        localStorage.clear();
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const result = await exportUserData();
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
                return;
            }
            // Download as JSON file
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `intervu-data-export-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setMessage({ type: 'success', text: 'Data exported successfully.' });
            setTimeout(() => setMessage(null), 3000);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || "Failed to export data." });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return;
        setIsDeleting(true);
        try {
            localStorage.clear();
            const result = await deleteAccount();
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
                setIsDeleting(false);
                return;
            }
            router.push("/");
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || "Failed to delete account." });
            setIsDeleting(false);
        }
    };

    // Listen for auth state changes
    useEffect(() => {
        const supabase = createClient();

        // Initial check
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUser(user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const supabase = createClient();

            try {
                // Fetch Stories
                const { data: storiesData } = await fetchStories();
                if (storiesData) {
                    try {
                        const parsed = JSON.parse(storiesData);
                        if (Array.isArray(parsed)) {
                            setStories(parsed);
                        }
                    } catch (e) {
                        console.warn("Legacy story format found, starting fresh.");
                    }
                }

                // Fetch Profile (Settings)
                const { data: profileData } = await fetchProfile();
                if (profileData) {
                    if (profileData.custom_api_key) setApiKey(profileData.custom_api_key);
                    if (profileData.preferred_model) setModel(profileData.preferred_model);
                } else {
                    // Guest mode: Load from localStorage
                    const guestKey = localStorage.getItem('guest_api_key');
                    const guestModel = localStorage.getItem('guest_model');

                    if (guestKey) setApiKey(guestKey);
                    if (guestModel) setModel(guestModel);
                }

                // Fetch Sources
                const { data: sourcesData } = await fetchSources();
                if (sourcesData) {
                    setSources(sourcesData);
                }

                // Fetch App Config (for donation feature flag)
                const { data: configData } = await getAppConfig();
                if (configData) {
                    setAppConfig(configData);
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user?.id]);

    const handleModelSave = async (key: string, mod: string) => {
        setApiKey(key);
        setModel(mod);
        // Also trigger save immediately
        setIsSaving(true);
        try {
            const res = await updateModelSettings(key, mod);

            if (res.error && res.error === "Unauthorized") {
                // Guest mode fallback: save to localStorage
                localStorage.setItem('guest_api_key', key);
                localStorage.setItem('guest_model', mod);
                setMessage({ type: 'success', text: 'Settings saved locally (guest mode).' });
            } else if (res.error) {
                throw new Error(res.error);
            } else {
                setMessage({ type: 'success', text: 'Model settings saved.' });
            }

            setTimeout(() => setMessage(null), 3000);
        } catch (e: unknown) {
            const error = e as Error;
            setMessage({ type: 'error', text: error.message || "Failed to save model settings." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageLayout
            header={
                <PageHeader
                    title="Settings"
                    actions={
                        <>
                            <NavMenu
                                user={user}
                                onSignInClick={() => setAuthPopoverOpen(true)}
                                onSignOut={handleSignOut}
                            />
                            <AuthPopover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen} showTrigger={false} />
                        </>
                    }
                >
                    {/* Tabs */}
                    <div className="flex gap-4 sm:gap-6 overflow-x-auto -mb-4 scrollbar-none">
                        {['stories', 'sources', 'models', 'appearance', 'account'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as typeof activeTab)}
                                className={`pb-3 text-sm font-medium transition-all duration-150 border-b-2 capitalize whitespace-nowrap ${activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </PageHeader>
            }
        >
            {message && (
                <div className={`mb-6 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-muted text-foreground' : 'bg-destructive/5 text-destructive'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'stories' && (
                <div className="animate-in fade-in duration-300">
                    <p className="text-sm text-muted-foreground mb-6">Your library of experiences for behavioral questions</p>

                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                            <p className="text-sm">Loading stories...</p>
                        </div>
                    ) : (
                        <StoryManager
                            stories={stories}
                            onChange={async (newStories) => {
                                setStories(newStories);
                                setIsSaving(true);
                                try {
                                    const res = await saveStories(newStories);
                                    if (res.error) throw new Error(res.error);
                                } catch (e: any) {
                                    setMessage({ type: 'error', text: e.message || "Failed to save stories." });
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                        />
                    )}
                </div>
            )}

            {activeTab === 'sources' && (
                <div className="animate-in fade-in duration-300">
                    <p className="text-sm text-muted-foreground mb-6">External context for generating company-specific answers</p>
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                            <p className="text-sm">Loading sources...</p>
                        </div>
                    ) : (
                        <SourcesManager sources={sources} onChange={setSources} />
                    )}
                </div>
            )}

            {activeTab === 'models' && (
                <div className="animate-in fade-in duration-300">
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
                            <p className="text-sm">Loading settings...</p>
                        </div>
                    ) : (
                        <ModelSettings
                            apiKey={apiKey}
                            model={model}
                            onSave={handleModelSave}
                            loading={isSaving}
                        />
                    )}
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="animate-in fade-in duration-300">
                    <p className="text-sm text-muted-foreground mb-6">Customize the look and feel of your workspace</p>
                    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-[var(--shadow-sm)]">
                        <h3 className="text-sm font-semibold mb-4">Accent Color</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {themeNames.map((name) => {
                                const t = themes[name];
                                const isActive = theme === name;
                                const swatchColor = `rgb(${t.colors.light.brand})`;
                                return (
                                    <button
                                        key={name}
                                        onClick={() => setThemeFn(name)}
                                        className={`group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-150 ${isActive
                                                ? 'shadow-sm'
                                                : 'hover:bg-muted/30 shadow-[var(--shadow-sm)]'
                                            }`}
                                        style={isActive ? {
                                            boxShadow: `0 0 0 2px ${swatchColor}`,
                                            backgroundColor: `color-mix(in srgb, ${swatchColor} 8%, transparent)`,
                                        } : undefined}
                                    >
                                        <div
                                            className="relative w-8 h-8 rounded-full shadow-sm border border-black/10 flex items-center justify-center"
                                            style={{ backgroundColor: swatchColor }}
                                        >
                                            {isActive && (
                                                <Check size={16} weight="bold" className="text-white drop-shadow-sm" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium capitalize">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'account' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <p className="text-sm text-muted-foreground">Manage your account data and privacy</p>

                    {/* Export Data */}
                    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-[var(--shadow-sm)]">
                        <h3 className="text-sm font-semibold mb-2">Export Data</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Download a copy of all your data including your profile, resume, stories, sources,
                            applications, and interview prep. API keys are excluded for security.
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="gap-2"
                        >
                            {isExporting ? (
                                <CircleNotch size={16} className="animate-spin" />
                            ) : (
                                <DownloadSimple size={16} />
                            )}
                            {isExporting ? "Exporting..." : "Export All Data"}
                        </Button>
                    </div>

                    {/* Support the Project */}
                    {appConfig?.show_donation && appConfig.donation_url && (
                        <div className="bg-card rounded-xl p-4 sm:p-6 shadow-[var(--shadow-sm)]">
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Heart size={16} weight="fill" className="text-pink-500" />
                                Support the Project
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                If you find this tool helpful, consider supporting its development. Every contribution helps keep the project going.
                            </p>
                            <a href={appConfig.donation_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="gap-2 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-950/20">
                                    <Heart size={16} weight="fill" />
                                    Buy Me a Coffee
                                </Button>
                            </a>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-[var(--shadow-sm)] border border-destructive/20">
                        <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                            Your resume, stories, sources, applications, and all other data will be permanently removed.
                        </p>
                        <Button
                            variant="outline"
                            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash size={16} />
                            Delete Account
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={(open) => {
                setShowDeleteDialog(open);
                if (!open) setDeleteConfirmText("");
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <WarningOctagon size={20} className="text-destructive" />
                            Delete Account
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete your account and all your data. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">
                            Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm:
                        </p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="font-mono"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== "DELETE" || isDeleting}
                            className="gap-2"
                        >
                            {isDeleting ? (
                                <CircleNotch size={16} className="animate-spin" />
                            ) : (
                                <Trash size={16} />
                            )}
                            {isDeleting ? "Deleting..." : "Delete Forever"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
