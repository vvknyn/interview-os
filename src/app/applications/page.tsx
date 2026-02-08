"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Application, getApplications, createApplication, updateApplication, deleteApplication } from "@/actions/application";
import { saveTailoredVersion } from "@/actions/tailor-resume";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Calendar, FileText, CaretRight, MagnifyingGlass, Buildings, Clock, Confetti, XCircle, ArrowBendUpRight, Funnel } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ApplicationWizard, ApplicationDraft } from "@/components/applications/ApplicationWizard";
import { ApplicationSummary } from "@/components/applications/ApplicationSummary";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { NavMenu } from "@/components/layout/NavMenu";
import { AuthPopover } from "@/components/auth/auth-popover";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

type ViewState = "list" | "wizard" | "detail";

const STATUS_CONFIG = {
    applied: { label: "Applied", color: "bg-blue-100 text-blue-700", icon: Clock },
    interviewing: { label: "Interviewing", color: "bg-purple-100 text-purple-700", icon: Briefcase },
    offer: { label: "Offer", color: "bg-green-100 text-green-700", icon: Confetti },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
    withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-700", icon: ArrowBendUpRight }
};

// Loading fallback component
function ApplicationsLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Loading applications...</p>
            </div>
        </div>
    );
}

// Main content component that uses useSearchParams
function ApplicationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState<ViewState>("list");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authPopoverOpen, setAuthPopoverOpen] = useState(false);

    // Legacy modal for quick edits
    const [modalOpen, setModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | undefined>(undefined);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        localStorage.clear();
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    const loadApplications = async () => {
        setLoading(true);
        try {
            const result = await getApplications();
            if (result.data) {
                setApplications(result.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();

        // Check URL params for view state
        const view = searchParams.get("view");
        const appId = searchParams.get("id");

        if (view === "new") {
            setViewState("wizard");
        } else if (view === "detail" && appId) {
            // Find the application and show detail
            const app = applications.find(a => a.id === appId);
            if (app) {
                setSelectedApp(app);
                setViewState("detail");
            }
        }
    }, [searchParams]);

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = searchQuery === "" ||
            app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.position.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === null || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Group by status for summary
    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleStartNewApplication = () => {
        // Direct flow to Resume Builder for job analysis and auto-creation
        router.push("/resume-builder?openTailoring=true&source=new-application");
    };

    const handleViewApplication = (app: Application) => {
        setSelectedApp(app);
        setViewState("detail");
        router.push(`/applications?view=detail&id=${app.id}`, { scroll: false });
    };

    const handleBackToList = () => {
        setViewState("list");
        setSelectedApp(null);
        router.push("/applications", { scroll: false });
    };

    const handleWizardComplete = async (draft: ApplicationDraft) => {
        try {
            // 1. Save tailored resume version if there are recommendations
            let resumeVersionId: string | undefined;

            if (draft.selectedRecommendations && draft.selectedRecommendations.length > 0 && draft.baseResume) {
                const versionData = {
                    versionName: draft.versionName || `${draft.jobAnalysis?.companyName} - ${draft.jobAnalysis?.positionTitle}`,
                    jobAnalysisId: draft.jobAnalysis?.id,
                    originalSummary: draft.baseResume.generatedSummary,
                    originalExperience: draft.baseResume.experience,
                    originalCompetencies: draft.baseResume.competencies,
                    originalProfile: draft.baseResume.profile,
                    originalEducation: draft.baseResume.education,
                    tailoredSummary: draft.baseResume.generatedSummary, // Would be modified by recommendations
                    tailoredExperience: draft.baseResume.experience,
                    tailoredCompetencies: draft.baseResume.competencies,
                    recommendations: draft.selectedRecommendations,
                    companyName: draft.jobAnalysis?.companyName || "",
                    positionTitle: draft.jobAnalysis?.positionTitle || "",
                    jobPosting: draft.jobText,
                    appliedAt: draft.applicationDate
                };

                const versionResult = await saveTailoredVersion(versionData);
                if (versionResult.data?.id) {
                    resumeVersionId = versionResult.data.id;
                }
            }

            // 2. Create the application
            const result = await createApplication({
                company_name: draft.jobAnalysis?.companyName || "Unknown Company",
                position: draft.jobAnalysis?.positionTitle || "Unknown Position",
                job_url: draft.jobUrl,
                applied_at: draft.applicationDate,
                status: draft.status || 'applied',
                resume_version_id: resumeVersionId,
                cover_letter: draft.coverLetter
            });

            if (result.error) {
                throw new Error(result.error);
            }

            // 3. Refresh and go back to list
            await loadApplications();
            handleBackToList();

        } catch (e: any) {
            console.error("Failed to save application:", e);
            alert("Failed to save application: " + e.message);
        }
    };

    const handleWizardCancel = () => {
        handleBackToList();
    };

    const handleStatusChange = async (newStatus: Application['status']) => {
        if (!selectedApp) return;

        try {
            await updateApplication(selectedApp.id, { status: newStatus });
            setSelectedApp({ ...selectedApp, status: newStatus });
            loadApplications();
        } catch (e) {
            console.error("Failed to update status:", e);
        }
    };

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

    const handleDeleteApplication = () => {
        if (!selectedApp) return;
        setDeleteConfirmationOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedApp) return;

        setDeleteConfirmationOpen(false);
        try {
            const result = await deleteApplication(selectedApp.id);
            if (result.error) {
                alert("Failed to delete application: " + result.error);
                return;
            }
            handleBackToList();
            loadApplications();
        } catch (e: any) {
            console.error("Failed to delete:", e);
            alert("An unexpected error occurred: " + e.message);
        }
    };

    const handleQuickEdit = (app: Application) => {
        setEditingApp(app);
        setModalOpen(true);
    };

    const renderContent = () => {
        if (viewState === "wizard") {
            return (
                <ApplicationWizard
                    onComplete={handleWizardComplete}
                    onCancel={handleWizardCancel}
                />
            );
        }

        if (viewState === "detail" && selectedApp) {
            return (
                <ApplicationSummary
                    application={selectedApp}
                    onBack={handleBackToList}
                    onEdit={() => handleQuickEdit(selectedApp)}
                    onDelete={handleDeleteApplication}
                    onStatusChange={handleStatusChange}
                />
            );
        }

        // List View
        return (
            <PageLayout
                header={
                    <PageHeader
                        title="Applications"
                        actions={
                            <>
                                <Button onClick={handleStartNewApplication} size="sm" className="gap-2">
                                    <Plus size={16} />
                                    <span className="hidden sm:inline">New Application</span>
                                    <span className="sm:hidden">New</span>
                                </Button>
                                <NavMenu
                                    user={user}
                                    onSignInClick={() => setAuthPopoverOpen(true)}
                                    onSignOut={handleSignOut}
                                />
                                <AuthPopover open={authPopoverOpen} onOpenChange={setAuthPopoverOpen} showTrigger={false} />
                            </>
                        }
                    />
                }
            >
                {/* Stats Overview */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
                    {(Object.entries(STATUS_CONFIG) as [Application['status'], typeof STATUS_CONFIG['applied']][]).map(([status, config]) => {
                        const count = statusCounts[status] || 0;
                        const Icon = config.icon;
                        const isActive = statusFilter === status;

                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(isActive ? null : status)}
                                className={cn(
                                    "bg-card rounded-xl p-3 sm:p-4 transition-all",
                                    isActive
                                        ? "shadow-sm ring-2 ring-brand/20"
                                        : "shadow-sm hover:shadow-md"
                                )}
                            >
                                <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1.5 sm:mb-2", config.color)}>
                                    <Icon size={14} weight="fill" className="sm:hidden" />
                                    <Icon size={16} weight="fill" className="hidden sm:block" />
                                </div>
                                <div className="text-xl sm:text-2xl font-bold">{count}</div>
                                <div className="text-[10px] sm:text-xs text-muted-foreground">{config.label}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-2 sm:gap-3 mb-6">
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Search applications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-card"
                        />
                    </div>
                    {statusFilter && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusFilter(null)}
                            className="gap-1 shrink-0"
                        >
                            <Funnel size={14} />
                            <span className="hidden sm:inline">Clear Filter</span>
                            <span className="sm:hidden">Clear</span>
                        </Button>
                    )}
                </div>

                {/* Applications List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-card rounded-xl animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <Briefcase size={28} className="text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                            {applications.length === 0 ? "No applications yet" : "No matches found"}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            {applications.length === 0
                                ? "Start tracking your job applications to see them here."
                                : "Try adjusting your search or filters."}
                        </p>
                        {applications.length === 0 && (
                            <Button onClick={handleStartNewApplication} className="gap-2">
                                <Plus size={18} />
                                Track Your First Application
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredApplications.map((app) => {
                            const config = STATUS_CONFIG[app.status];
                            const Icon = config.icon;

                            return (
                                <button
                                    key={app.id}
                                    onClick={() => handleViewApplication(app)}
                                    className="w-full bg-card rounded-xl shadow-sm p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all text-left group"
                                >
                                    {/* Company Icon */}
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                                        <Buildings size={20} className="text-brand sm:hidden" />
                                        <Buildings size={24} className="text-brand hidden sm:block" />
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold truncate text-sm sm:text-base">{app.company_name}</h3>
                                            <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", config.color)}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{app.position}</p>
                                    </div>

                                    {/* Metadata - hidden on mobile */}
                                    <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                                        {app.applied_at && (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {new Date(app.applied_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        )}
                                        {app.resume_version && (
                                            <div className="flex items-center gap-1.5">
                                                <FileText size={14} />
                                                <span className="max-w-[100px] truncate">{app.resume_version.version_name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <CaretRight
                                        size={20}
                                        className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0"
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </PageLayout>
        );
    };

    // Render based on view state
    return (
        <>
            {renderContent()}

            {/* Legacy Modal for Quick Edits */}
            <ApplicationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                application={editingApp}
                onSuccess={() => {
                    loadApplications();
                    if (selectedApp && editingApp?.id === selectedApp.id) {
                        getApplications().then(result => {
                            const updated = result.data?.find(a => a.id === selectedApp.id);
                            if (updated) setSelectedApp(updated);
                        });
                    }
                }}
            />

            <Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this application? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmationOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Main page component with Suspense boundary
export default function ApplicationsPage() {
    return (
        <Suspense fallback={<ApplicationsLoading />}>
            <ApplicationsContent />
        </Suspense>
    );
}
