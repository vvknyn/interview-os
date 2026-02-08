"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Buildings,
    Briefcase,
    Calendar,
    FileText,
    Envelope,
    CheckCircle,
    ArrowRight,
    Eye,
    CaretDown,
    CaretUp
} from "@phosphor-icons/react";
import { ApplicationDraft } from "../ApplicationWizard";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
    draft: ApplicationDraft;
    onUpdate: (updates: Partial<ApplicationDraft>) => void;
}

export function ReviewStep({ draft, onUpdate }: ReviewStepProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["changes"]));

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const selectedCount = draft.selectedRecommendations?.length || 0;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Review Application</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Review your application details before tracking it in your dashboard.
                </p>
            </div>

            {/* Summary Header */}
            <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden border border-brand/20">
                <div className="p-6 bg-brand/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-card shadow-[var(--shadow-sm)] border border-brand/10 flex items-center justify-center text-brand">
                            <Buildings size={28} weight="fill" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{draft.jobAnalysis?.companyName || "Company"}</h2>
                            <p className="text-muted-foreground font-medium">{draft.jobAnalysis?.positionTitle || "Position"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card/80 rounded-xl border border-brand/10 p-3 text-center shadow-[var(--shadow-sm)]">
                            <div className="text-2xl font-bold text-brand">{selectedCount}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Resume Changes</div>
                        </div>
                        <div className="bg-card/80 rounded-xl border border-brand/10 p-3 text-center shadow-[var(--shadow-sm)]">
                            <div className={cn("text-2xl font-bold", draft.coverLetter ? "text-brand" : "text-muted-foreground")}>
                                {draft.coverLetter ? "Yes" : "No"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Cover Letter</div>
                        </div>
                        <div className="bg-card/80 rounded-xl border border-brand/10 p-3 text-center shadow-[var(--shadow-sm)]">
                            <div className="text-2xl font-bold text-brand">Ready</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Status</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Details */}
            <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="p-4 border-b border-border/50">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        <Calendar size={18} />
                        Application Details
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="applicationDate">
                                Application Date
                            </Label>
                            <Input
                                id="applicationDate"
                                type="date"
                                value={draft.applicationDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => onUpdate({ applicationDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="versionName">
                                Resume Version Name
                            </Label>
                            <Input
                                id="versionName"
                                value={draft.versionName || ""}
                                onChange={(e) => onUpdate({ versionName: e.target.value })}
                                placeholder="e.g. Google - Senior Engineer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Resume Changes - Collapsible */}
            <CollapsibleSection
                title="Resume Changes"
                icon={<FileText size={18} />}
                badge={`${selectedCount} changes`}
                isExpanded={expandedSections.has("changes")}
                onToggle={() => toggleSection("changes")}
            >
                {selectedCount > 0 ? (
                    <div className="space-y-3">
                        {draft.selectedRecommendations?.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                                <CheckCircle size={18} className="text-brand mt-0.5 flex-shrink-0" weight="fill" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                            {rec.category}
                                        </Badge>
                                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] uppercase tracking-wider">
                                            {rec.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-through mb-1 opacity-70">
                                        {rec.original?.substring(0, 80)}...
                                    </p>
                                    <p className="text-sm font-medium text-foreground">
                                        <ArrowRight size={12} className="inline mr-1 text-brand" />
                                        {rec.suggested.substring(0, 100)}...
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed border-border">
                        No changes selected. Your original resume will be used.
                    </p>
                )}
            </CollapsibleSection>

            {/* Cover Letter - Collapsible */}
            <CollapsibleSection
                title="Cover Letter"
                icon={<Envelope size={18} />}
                badge={draft.coverLetter ? "Included" : "Not included"}
                isExpanded={expandedSections.has("coverLetter")}
                onToggle={() => toggleSection("coverLetter")}
            >
                {draft.coverLetter ? (
                    <div className="prose prose-sm max-w-none text-foreground/80 bg-muted/20 p-4 rounded-lg border border-border/50">
                        {draft.coverLetter.split('\n').slice(0, 5).map((p, i) => (
                            <p key={i} className="text-sm leading-relaxed mb-2 last:mb-0">{p}</p>
                        ))}
                        {draft.coverLetter.split('\n').length > 5 && (
                            <p className="text-xs text-muted-foreground italic mt-2">
                                ... and {draft.coverLetter.split('\n').length - 5} more paragraphs
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed border-border">
                        No cover letter included. You can add one later.
                    </p>
                )}
            </CollapsibleSection>

            {/* Job Requirements Preview - Collapsible */}
            {draft.jobAnalysis && (
                <CollapsibleSection
                    title="Job Requirements"
                    icon={<Briefcase size={18} />}
                    badge={`${draft.jobAnalysis.extractedRequirements?.length || 0} requirements`}
                    isExpanded={expandedSections.has("requirements")}
                    onToggle={() => toggleSection("requirements")}
                >
                    <div className="space-y-3">
                        {draft.jobAnalysis.extractedRequirements?.slice(0, 5).map((req, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
                                <span className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs flex-shrink-0 font-medium">
                                    {i + 1}
                                </span>
                                <span className="text-foreground/90">{req}</span>
                            </div>
                        ))}
                        {(draft.jobAnalysis.extractedRequirements?.length || 0) > 5 && (
                            <p className="text-xs text-muted-foreground italic pl-2">
                                +{(draft.jobAnalysis.extractedRequirements?.length || 0) - 5} more requirements
                            </p>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Final CTA */}
            <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] border border-brand/20 overflow-hidden">
                <div className="p-6 text-center bg-brand/5">
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3 text-brand">
                        <CheckCircle size={24} weight="fill" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Ready to Track</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                        Click "Save Application" below to add this to your applications list. You can update
                        the status as you progress through the interview process.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    badge: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function CollapsibleSection({
    title,
    icon,
    badge,
    isExpanded,
    onToggle,
    children
}: CollapsibleSectionProps) {
    return (
        <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <span className="font-medium">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-normal text-xs">
                        {badge}
                    </Badge>
                    {isExpanded ? <CaretUp size={16} className="text-muted-foreground" /> : <CaretDown size={16} className="text-muted-foreground" />}
                </div>
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 pt-1 animate-in slide-in-from-top-2 duration-200">
                    <div className="pt-3 border-t border-border/50">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}
