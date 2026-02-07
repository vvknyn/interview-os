"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            {/* Summary Header */}
            <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-transparent rounded-2xl border border-brand/20 p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        <Buildings size={28} className="text-brand" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{draft.jobAnalysis?.companyName || "Company"}</h2>
                        <p className="text-muted-foreground">{draft.jobAnalysis?.positionTitle || "Position"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-brand">{selectedCount}</div>
                        <div className="text-xs text-muted-foreground">Resume Changes</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-brand">
                            {draft.coverLetter ? "Yes" : "No"}
                        </div>
                        <div className="text-xs text-muted-foreground">Cover Letter</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">Ready</div>
                        <div className="text-xs text-muted-foreground">Status</div>
                    </div>
                </div>
            </div>

            {/* Application Details */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={18} />
                    Application Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="applicationDate" className="text-sm text-muted-foreground">
                            Application Date
                        </Label>
                        <Input
                            id="applicationDate"
                            type="date"
                            value={draft.applicationDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => onUpdate({ applicationDate: e.target.value })}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="versionName" className="text-sm text-muted-foreground">
                            Resume Version
                        </Label>
                        <Input
                            id="versionName"
                            value={draft.versionName || ""}
                            onChange={(e) => onUpdate({ versionName: e.target.value })}
                            className="mt-1"
                            placeholder="Version name"
                        />
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
                            <div key={i} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                                <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" weight="fill" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-green-700 uppercase">
                                            {rec.category}
                                        </span>
                                        <span className={cn(
                                            "text-xs px-1.5 py-0.5 rounded",
                                            rec.priority === 'high' ? "bg-red-100 text-red-700" :
                                                rec.priority === 'medium' ? "bg-amber-100 text-amber-700" :
                                                    "bg-blue-100 text-blue-700"
                                        )}>
                                            {rec.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-through mb-1">
                                        {rec.original?.substring(0, 80)}...
                                    </p>
                                    <p className="text-sm text-green-800">
                                        <ArrowRight size={12} className="inline mr-1" />
                                        {rec.suggested.substring(0, 100)}...
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
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
                    <div className="prose prose-sm max-w-none">
                        {draft.coverLetter.split('\n').slice(0, 5).map((p, i) => (
                            <p key={i} className="text-sm text-muted-foreground mb-2">{p}</p>
                        ))}
                        {draft.coverLetter.split('\n').length > 5 && (
                            <p className="text-xs text-muted-foreground italic">
                                ... and {draft.coverLetter.split('\n').length - 5} more paragraphs
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
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
                            <div key={i} className="flex items-start gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs flex-shrink-0">
                                    {i + 1}
                                </span>
                                <span className="text-muted-foreground">{req}</span>
                            </div>
                        ))}
                        {(draft.jobAnalysis.extractedRequirements?.length || 0) > 5 && (
                            <p className="text-xs text-muted-foreground italic pl-7">
                                +{(draft.jobAnalysis.extractedRequirements?.length || 0) - 5} more requirements
                            </p>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Final CTA */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 text-center">
                <CheckCircle size={40} weight="fill" className="text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg text-green-900">Ready to Track</h3>
                <p className="text-sm text-green-700 mt-1 max-w-md mx-auto">
                    Click "Save Application" to add this to your applications list. You can update
                    the status as you progress through the interview process.
                </p>
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
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <span className="font-medium">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {badge}
                    </span>
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
