"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Buildings,
    Briefcase,
    Calendar,
    FileText,
    Envelope,
    ArrowLeft,
    PencilSimple,
    Trash,
    Copy,
    Check,
    LinkSimple,
    CaretDown,
    CaretUp,
    CheckCircle,
    Clock,
    XCircle,
    Confetti,
    ArrowBendUpRight
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Application {
    id: string;
    company_name: string;
    position: string;
    job_url?: string;
    applied_at?: string;
    status: 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
    resume_version_id?: string;
    cover_letter?: string;
    created_at: string;
    resume_version?: {
        version_name: string;
        company_name?: string;
        position_title?: string;
        tailored_summary?: string;
        recommendations?: any[];
    } | null;
}

interface ApplicationSummaryProps {
    application: Application;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: Application['status']) => void;
}

const STATUS_CONFIG = {
    applied: {
        label: "Applied",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
        description: "Application submitted"
    },
    interviewing: {
        label: "Interviewing",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Briefcase,
        description: "In interview process"
    },
    offer: {
        label: "Offer",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: Confetti,
        description: "Received an offer!"
    },
    rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        description: "Application not successful"
    },
    withdrawn: {
        label: "Withdrawn",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: ArrowBendUpRight,
        description: "You withdrew the application"
    }
};

export function ApplicationSummary({
    application,
    onBack,
    onEdit,
    onDelete,
    onStatusChange
}: ApplicationSummaryProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));
    const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

    const statusConfig = STATUS_CONFIG[application.status];
    const StatusIcon = statusConfig.icon;

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handleCopyCoverLetter = async () => {
        if (application.cover_letter) {
            await navigator.clipboard.writeText(application.cover_letter);
            setCopiedCoverLetter(true);
            setTimeout(() => setCopiedCoverLetter(false), 2000);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Not set";
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={16} />
                            Back to Applications
                        </button>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={onEdit}>
                                <PencilSimple size={16} className="mr-1" />
                                Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash size={16} className="mr-1" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Hero Section */}
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <Buildings size={32} className="text-brand" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{application.company_name}</h1>
                                    <p className="text-muted-foreground text-lg">{application.position}</p>
                                </div>
                            </div>
                            <Badge className={cn("text-sm px-3 py-1 border", statusConfig.color)}>
                                <StatusIcon size={14} className="mr-1" weight="fill" />
                                {statusConfig.label}
                            </Badge>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/80 rounded-xl p-3">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Applied On
                                </div>
                                <div className="font-semibold">{formatDate(application.applied_at)}</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <FileText size={12} />
                                    Resume
                                </div>
                                <div className="font-semibold truncate">
                                    {application.resume_version?.version_name || "Original"}
                                </div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3">
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Envelope size={12} />
                                    Cover Letter
                                </div>
                                <div className="font-semibold">
                                    {application.cover_letter ? "Included" : "None"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Section - Always Expanded */}
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle size={18} />
                        Update Status
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {(Object.keys(STATUS_CONFIG) as Array<Application['status']>).map((status) => {
                            const config = STATUS_CONFIG[status];
                            const Icon = config.icon;
                            const isActive = application.status === status;

                            return (
                                <button
                                    key={status}
                                    onClick={() => onStatusChange(status)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                        isActive
                                            ? "border-brand bg-brand/5"
                                            : "border-transparent hover:border-border hover:bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        isActive ? config.color : "bg-muted"
                                    )}>
                                        <Icon size={18} weight={isActive ? "fill" : "regular"} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        isActive ? "text-brand" : "text-muted-foreground"
                                    )}>
                                        {config.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Job URL */}
                {application.job_url && (
                    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <LinkSimple size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Job Posting</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                        {application.job_url}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={application.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand hover:underline"
                            >
                                View Posting
                            </a>
                        </div>
                    </div>
                )}

                {/* Cover Letter Section */}
                {application.cover_letter && (
                    <CollapsibleCard
                        title="Cover Letter"
                        icon={<Envelope size={18} />}
                        isExpanded={expandedSections.has("coverLetter")}
                        onToggle={() => toggleSection("coverLetter")}
                        actions={
                            <Button variant="ghost" size="sm" onClick={handleCopyCoverLetter}>
                                {copiedCoverLetter ? (
                                    <><Check size={14} className="mr-1 text-green-600" /> Copied</>
                                ) : (
                                    <><Copy size={14} className="mr-1" /> Copy</>
                                )}
                            </Button>
                        }
                    >
                        <div className="prose prose-sm max-w-none">
                            {application.cover_letter.split('\n').map((p, i) => (
                                <p key={i} className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                    {p}
                                </p>
                            ))}
                        </div>
                    </CollapsibleCard>
                )}

                {/* Resume Changes Section */}
                {application.resume_version?.recommendations && application.resume_version.recommendations.length > 0 && (
                    <CollapsibleCard
                        title="Resume Changes"
                        icon={<FileText size={18} />}
                        badge={`${application.resume_version.recommendations.length} changes`}
                        isExpanded={expandedSections.has("resumeChanges")}
                        onToggle={() => toggleSection("resumeChanges")}
                    >
                        <div className="space-y-3">
                            {application.resume_version.recommendations.map((rec: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" weight="fill" />
                                    <div>
                                        <span className="text-xs font-medium text-green-700 uppercase">
                                            {rec.category}
                                        </span>
                                        <p className="text-sm text-green-800 mt-1">{rec.suggested}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleCard>
                )}

                {/* Timeline placeholder for future */}
                <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-6 text-center">
                    <Clock size={32} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                        Activity timeline coming soon
                    </p>
                </div>
            </div>
        </div>
    );
}

// Collapsible Card Component
interface CollapsibleCardProps {
    title: string;
    icon: React.ReactNode;
    badge?: string;
    isExpanded: boolean;
    onToggle: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

function CollapsibleCard({
    title,
    icon,
    badge,
    isExpanded,
    onToggle,
    actions,
    children
}: CollapsibleCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <span className="font-medium">{title}</span>
                    {badge && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isExpanded && actions}
                    {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                </div>
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4">
                    {children}
                </div>
            )}
        </div>
    );
}
