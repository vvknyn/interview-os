"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TailoredResumeVersion, JobAnalysis, TailoringRecommendation, ResumeData } from "@/types/resume";
import {
    fetchTailoredVersions,
    deleteTailoredVersion,
    updateVersionName,
    analyzeJobRequirements,
    generateTailoringRecommendations,
    saveTailoredVersion
} from "@/actions/tailor-resume";
import { fetchResumeData } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    Trash,
    Check,
    Calendar,
    Target,
    CaretRight,
    X,
    Eye,
    Buildings,
    Sparkle,
    CircleNotch,
    ArrowLeft,
    PencilSimple
} from "@phosphor-icons/react";
import { JobAnalysisPanel } from "@/components/resume-tailor/JobAnalysisPanel";
import { RecommendationsPanel } from "@/components/resume-tailor/RecommendationsPanel";

// Session storage key for caching sidebar state
const SIDEBAR_CACHE_KEY = "tailor-sidebar-state";

import { fetchApplicationById, linkResumeVersionToApplication } from "@/actions/applications";
import { createApplication } from "@/actions/application";

interface TailoredVersionsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentVersionId?: string; // Currently viewed version
    applicationId?: string;
    isNewApplication?: boolean;
}

type ViewState = 'list' | 'create' | 'analysis' | 'recommendations';

export function TailoredVersionsSidebar({ isOpen, onClose, currentVersionId, applicationId, isNewApplication }: TailoredVersionsSidebarProps) {
    const [view, setView] = useState<ViewState>('list');
    const [versions, setVersions] = useState<TailoredResumeVersion[]>([]);

    // Application context
    const [contextAppId, setContextAppId] = useState<string | undefined>(applicationId);

    // Auto-switch to analysis for new applications
    useEffect(() => {
        if (isNewApplication) {
            setView('analysis');
        }
    }, [isNewApplication]);

    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    // Job analysis states
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [jobInput, setJobInput] = useState("");
    const [jobUrl, setJobUrl] = useState("");
    const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
    const [recommendations, setRecommendations] = useState<TailoringRecommendation[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track which version we're editing (for updates vs creates)
    const [editingVersionId, setEditingVersionId] = useState<string | null>(null);

    // Cache state to sessionStorage when it changes
    const saveStateToCache = useCallback(() => {
        if (view === 'list') return; // Don't cache list view

        const stateToCache = {
            view,
            jobInput,
            jobUrl,
            jobAnalysis,
            recommendations,
            editingVersionId,
            timestamp: Date.now()
        };
        sessionStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify(stateToCache));
    }, [view, jobInput, jobUrl, jobAnalysis, recommendations, editingVersionId]);

    // Load cached state when sidebar opens
    const loadStateFromCache = useCallback(() => {
        try {
            const cached = sessionStorage.getItem(SIDEBAR_CACHE_KEY);
            if (cached) {
                const state = JSON.parse(cached);
                // Only restore if cache is less than 30 minutes old
                if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                    if (state.view) setView(state.view);
                    if (state.jobInput) setJobInput(state.jobInput);
                    if (state.jobUrl) setJobUrl(state.jobUrl);
                    if (state.jobAnalysis) setJobAnalysis(state.jobAnalysis);
                    if (state.recommendations) setRecommendations(state.recommendations);
                    if (state.editingVersionId) setEditingVersionId(state.editingVersionId);
                    return true;
                }
            }
        } catch (e) {
            console.error("Failed to load sidebar cache", e);
        }
        return false;
    }, []);

    // Save state to cache whenever relevant state changes
    useEffect(() => {
        if (isOpen && (view !== 'list' || jobAnalysis || recommendations.length > 0)) {
            saveStateToCache();
        }
    }, [isOpen, view, jobInput, jobUrl, jobAnalysis, recommendations, editingVersionId, saveStateToCache]);

    useEffect(() => {
        if (isOpen) {
            loadVersions();
            loadResume();
            // Try to restore cached state
            loadStateFromCache();
        }
    }, [isOpen, loadStateFromCache]);

    useEffect(() => {
        const handler = () => loadVersions();
        window.addEventListener('version-updated', handler);
        return () => window.removeEventListener('version-updated', handler);
    }, []);

    // Load application details if linking to an application
    useEffect(() => {
        const loadApplicationContext = async () => {
            if (!applicationId || !isOpen) return;

            // If we already have input or analysis, don't overwrite
            if (jobInput || jobAnalysis) return;

            try {
                const { data, error } = await fetchApplicationById(applicationId);
                if (data && !error) {
                    setJobInput(data.job_description || "");
                    setJobUrl(data.job_url || "");

                    // Switch to create mode automatically
                    setView('create');

                    // Optional: If we have text, we could auto-analyze
                    // But for now, let's just pre-fill
                }
            } catch (e) {
                console.error("Failed to load application context", e);
            }
        };

        loadApplicationContext();
    }, [applicationId, isOpen]);

    const loadVersions = async () => {
        setLoading(true);
        const { data, error } = await fetchTailoredVersions();
        if (!error && data) {
            setVersions(data);
        }
        setLoading(false);
    };

    const loadResume = async () => {
        const { data: dbData, error } = await fetchResumeData();
        if (dbData && !error) {
            setResumeData(dbData);
        } else {
            // Fall back to localStorage
            const saved = localStorage.getItem("interview-os-resume-data");
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    setResumeData(data);
                } catch (e) {
                    console.error("Failed to load resume data", e);
                }
            }
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const { error } = await deleteTailoredVersion(id);
        if (!error) {
            setVersions(versions.filter(v => v.id !== id));
            setDeleteConfirm(null);
            window.dispatchEvent(new Event('version-updated'));
        }
        setDeletingId(null);
    };

    const handleAnalyzeJob = async () => {
        if (!jobInput.trim() && !jobUrl.trim()) {
            setError("Please enter a job posting text or URL");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await analyzeJobRequirements(jobInput, jobUrl || undefined);
            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setJobAnalysis(result.data);

                // Auto-create application if this is a new application flow
                if (isNewApplication && !contextAppId) {
                    try {
                        const app = await createApplication({
                            company_name: result.data.companyName || "Unknown Company",
                            position: result.data.positionTitle || "Unknown Position",
                            job_url: jobUrl,
                            status: 'applied',
                            // job_description: jobInput (migration pending)
                        });

                        if (app.data) {
                            setContextAppId(app.data.id);
                        }
                    } catch (e) {
                        console.error("Failed to auto-create application", e);
                    }
                }

                setView('analysis');
            }
        } catch (e: any) {
            setError(e.message || "Failed to analyze job posting");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateRecommendations = async () => {
        if (!resumeData || !jobAnalysis) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateTailoringRecommendations(resumeData, jobAnalysis);
            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setRecommendations(result.data);
                setView('recommendations');
            }
        } catch (e: any) {
            setError(e.message || "Failed to generate recommendations");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveVersion = async (versionName: string, appliedRecommendations: TailoringRecommendation[]) => {
        if (!resumeData || !jobAnalysis) return;

        // Use currentVersionId or editingVersionId for updates
        const versionIdToUpdate = editingVersionId || currentVersionId;

        const tailoredData: Omit<TailoredResumeVersion, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string } = {
            id: versionIdToUpdate,
            jobAnalysisId: jobAnalysis?.id,
            versionName,
            companyName: jobAnalysis?.companyName || '',
            positionTitle: jobAnalysis?.positionTitle || '',

            // Original snapshot - COMPLETE resume data
            originalSummary: resumeData.generatedSummary || '',
            originalExperience: resumeData.experience || [],
            originalCompetencies: resumeData.competencies || [],
            originalProfile: resumeData.profile || { profession: '', yearsOfExperience: 0, location: '', email: '', phone: '', linkedin: '' },
            originalEducation: resumeData.education || [],
            sectionOrder: resumeData.sectionOrder,

            // Tailored content (currently same as original, will be customized later)
            tailoredSummary: resumeData.generatedSummary || '',
            tailoredExperience: resumeData.experience || [],
            tailoredCompetencies: resumeData.competencies || [],

            recommendations: [],
            appliedAt: new Date().toISOString()
        };

        const result = await saveTailoredVersion(tailoredData);

        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            const savedVersionId = result.data.id;

            // If we have an application context, link this version to the application
            if (contextAppId && savedVersionId) {
                try {
                    await linkResumeVersionToApplication(contextAppId, savedVersionId);
                    // Could show a specific success toast here
                } catch (e) {
                    console.error("Failed to link version to application", e);
                }
            }

            // If this was a new version, track it for future updates
            if (!versionIdToUpdate && savedVersionId) {
                setEditingVersionId(savedVersionId);
            }
            window.dispatchEvent(new Event('version-updated'));
            resetToList();
        }
    };

    const resetToList = (clearCache = true) => {
        setView('list');
        setJobInput("");
        setJobUrl("");
        setJobAnalysis(null);
        setRecommendations([]);
        setError(null);
        setEditingVersionId(null);
        if (clearCache) {
            sessionStorage.removeItem(SIDEBAR_CACHE_KEY);
        }
        loadVersions();
    };

    // Just close without resetting state (preserves cache)
    const handleClose = () => {
        onClose();
    };

    const handleBack = () => {
        if (view === 'recommendations') setView('analysis');
        else if (view === 'analysis') setView('create');
        else if (view === 'create') setView('list');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - just close, don't reset state */}
            <div
                className="fixed inset-0 bg-black/30 z-[60] animate-in fade-in duration-200"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed inset-y-0 right-0 w-[560px] bg-white dark:bg-zinc-950 border-l border-border shadow-2xl z-[70] flex flex-col animate-in slide-in-from-right-full duration-300">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {view !== 'list' && (
                            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2">
                                <ArrowLeft size={16} />
                            </Button>
                        )}
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                            <Sparkle size={16} weight="fill" className="text-brand" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">
                                {view === 'list' && 'Tailored Versions'}
                                {view === 'create' && 'Create New Version'}
                                {view === 'analysis' && 'Job Analysis'}
                                {view === 'recommendations' && 'Recommendations'}
                            </h3>
                            {view === 'list' && (
                                <p className="text-xs text-muted-foreground">{versions.length} saved</p>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                        <X size={16} />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* List View */}
                    {view === 'list' && (
                        <div className="p-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <CircleNotch size={32} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Sparkle size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">No versions yet</p>
                                    <p className="text-xs text-muted-foreground mt-1">Create your first tailored resume</p>
                                </div>
                            ) : (
                                versions.map((version) => (
                                    <VersionCard
                                        key={version.id}
                                        version={version}
                                        isActive={version.id === currentVersionId}
                                        deleteConfirm={deleteConfirm}
                                        deletingId={deletingId}
                                        onDelete={handleDelete}
                                        onDeleteConfirm={setDeleteConfirm}
                                        onClose={onClose}
                                        onVersionUpdated={loadVersions}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Create View - Job Input */}
                    {view === 'create' && (
                        <div className="p-4 space-y-4">
                            {!resumeData && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                                    No resume found. Please create a resume first.
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200 flex items-center justify-between">
                                    <span>{error}</span>
                                    <button onClick={() => setError(null)} className="hover:opacity-70">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Job URL (Optional)</label>
                                <Input
                                    placeholder="https://company.com/careers/job-123"
                                    value={jobUrl}
                                    onChange={(e) => setJobUrl(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Job Description (Required if no URL)</label>
                                <Textarea
                                    placeholder="Paste the full job posting text here..."
                                    value={jobInput}
                                    onChange={(e) => setJobInput(e.target.value)}
                                    rows={12}
                                    className="font-mono text-xs leading-relaxed resize-none"
                                />
                            </div>

                            <Button
                                onClick={handleAnalyzeJob}
                                disabled={isAnalyzing || (!jobInput.trim() && !jobUrl.trim()) || !resumeData}
                                className="w-full"
                                size="sm"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <CircleNotch size={14} className="animate-spin mr-2" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkle size={14} weight="fill" className="mr-2" />
                                        Analyze Job
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Analysis View */}
                    {view === 'analysis' && jobAnalysis && (
                        <div className="p-4">
                            <JobAnalysisPanel analysis={jobAnalysis} />
                        </div>
                    )}

                    {/* Recommendations View */}
                    {view === 'recommendations' && resumeData && (
                        <RecommendationsPanel
                            recommendations={recommendations}
                            resumeData={resumeData}
                            onSaveVersion={handleSaveVersion}
                            existingVersionName={currentVersionId ? versions.find(v => v.id === currentVersionId)?.versionName : undefined}
                            isUpdating={!!(currentVersionId || editingVersionId)}
                        />
                    )}
                </div>

                {/* Footer Actions */}
                {view === 'list' && (
                    <div className="p-4 border-t border-border shrink-0">
                        <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                            onClick={() => setView('create')}
                        >
                            <Sparkle size={14} weight="fill" className="mr-2" />
                            Create New Version
                        </Button>
                    </div>
                )}

                {view === 'analysis' && resumeData && (
                    <div className="p-4 border-t border-border shrink-0">
                        <Button
                            onClick={handleGenerateRecommendations}
                            disabled={isGenerating}
                            className="w-full"
                            size="sm"
                        >
                            {isGenerating ? (
                                <>
                                    <CircleNotch size={14} className="animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkle size={14} weight="fill" className="mr-2" />
                                    Generate Recommendations
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

function VersionCard({ version, isActive, deleteConfirm, deletingId, onDelete, onDeleteConfirm, onClose, onVersionUpdated }: {
    version: TailoredResumeVersion;
    isActive?: boolean;
    deleteConfirm: string | null;
    deletingId: string | null;
    onDelete: (id: string) => void;
    onDeleteConfirm: (id: string | null) => void;
    onClose: () => void;
    onVersionUpdated?: () => void;
}) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(version.versionName);
    const [isSaving, setIsSaving] = useState(false);

    // Determine if this is a snapshot (manual save) vs tailored (job-specific)
    const isSnapshot = !version.jobPosting || version.companyName === "Snapshot" || version.companyName === "Manual Save";

    const handleCardClick = () => {
        if (isEditing) return; // Don't navigate while editing
        router.push(`/resume-builder?versionId=${version.id}`);
        onClose();
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditName(version.versionName);
        setIsEditing(true);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditName(version.versionName);
    };

    const handleSaveEdit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!version.id || !editName.trim()) return;

        setIsSaving(true);
        const { error } = await updateVersionName(version.id, editName.trim());
        setIsSaving(false);

        if (!error) {
            setIsEditing(false);
            onVersionUpdated?.();
            window.dispatchEvent(new Event('version-updated'));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveEdit(e as any);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(version.versionName);
        }
    };

    return (
        <div
            className={`group rounded-lg p-3 transition-all ${isEditing ? '' : 'cursor-pointer'} ${isActive
                ? 'bg-brand/10 border-2 border-brand/50 shadow-sm'
                : 'bg-muted/10 hover:bg-muted/20 border border-border/40'
                }`}
            onClick={handleCardClick}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-sm"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={handleSaveEdit}
                                disabled={isSaving || !editName.trim()}
                            >
                                {isSaving ? (
                                    <CircleNotch size={14} className="animate-spin" />
                                ) : (
                                    <Check size={14} className="text-green-600" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium truncate">{version.versionName}</h4>
                            {/* Version Type Badge */}
                            <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 h-4 ${isSnapshot
                                    ? 'border-blue-300 text-blue-600 bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:bg-blue-950/50'
                                    : 'border-amber-300 text-amber-600 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950/50'
                                    }`}
                            >
                                {isSnapshot ? "Snapshot" : "Tailored"}
                            </Badge>
                            {isActive && (
                                <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 bg-brand/80">
                                    Active
                                </Badge>
                            )}
                        </div>
                    )}
                    {!isEditing && !isSnapshot && version.companyName && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{version.companyName}</p>
                    )}
                    {!isEditing && isSnapshot && version.positionTitle && version.positionTitle !== "Resume snapshot" && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 italic">{version.positionTitle}</p>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Edit Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleEditClick}
                            title="Edit version name"
                        >
                            <PencilSimple size={14} />
                        </Button>
                        {/* Delete Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!version.id) return;
                                if (deleteConfirm === version.id) {
                                    onDelete(version.id);
                                } else {
                                    onDeleteConfirm(version.id);
                                }
                            }}
                        >
                            {deletingId === version.id ? (
                                <CircleNotch size={14} className="animate-spin" />
                            ) : deleteConfirm === version.id ? (
                                <Check size={14} className="text-destructive" />
                            ) : (
                                <Trash size={14} />
                            )}
                        </Button>
                    </div>
                )}
            </div>
            {!isEditing && (
                <div className="flex items-center gap-2">
                    {!isSnapshot && version.positionTitle && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                            {version.positionTitle}
                        </Badge>
                    )}
                    {version.appliedAt && (
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(version.appliedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

interface TailoredVersionsToggleProps {
    isOpen: boolean;
    onToggle: () => void;
    count: number;
}

export function TailoredVersionsToggle({ isOpen, onToggle, count }: TailoredVersionsToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`group inline-flex items-center h-9 px-2.5 rounded-md border transition-all duration-200 ${isOpen
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border hover:border-brand/50 hover:bg-brand/5'
                }`}
        >
            <Sparkle size={16} weight="fill" className={isOpen ? 'text-brand' : 'text-muted-foreground group-hover:text-brand'} />
            <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">
                    Versions
                </span>
            </span>
            {count > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold bg-brand/20 text-brand px-1.5 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </button>
    );
}
