"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CircleNotch,
    CheckCircle,
    Sparkle,
    FileText,
    ArrowRight,
    WarningCircle,
    Check,
    X,
    Lightning
} from "@phosphor-icons/react";
import { ApplicationDraft } from "../ApplicationWizard";
import { fetchResumeData } from "@/actions/resume";
import { generateTailoringRecommendations } from "@/actions/tailor-resume";
import { TailoringRecommendation, ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResumeTailoringStepProps {
    draft: ApplicationDraft;
    onUpdate: (updates: Partial<ApplicationDraft>) => void;
}

export function ResumeTailoringStep({ draft, onUpdate }: ResumeTailoringStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [resumeData, setResumeData] = useState<ResumeData | null>(draft.baseResume || null);
    const [recommendations, setRecommendations] = useState<TailoringRecommendation[]>(draft.recommendations || []);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(draft.selectedRecommendations?.map((r, i) => r.id || `rec-${i}`) || [])
    );
    const [versionName, setVersionName] = useState(
        draft.versionName || `${draft.jobAnalysis?.companyName || 'Company'} - ${draft.jobAnalysis?.positionTitle || 'Role'}`
    );

    // Load resume data on mount
    useEffect(() => {
        const loadResume = async () => {
            if (resumeData) return;

            setIsLoading(true);
            setLoadingMessage("Loading your resume...");

            try {
                const result = await fetchResumeData();
                if (result.data) {
                    setResumeData(result.data);
                    onUpdate({ baseResume: result.data });
                }
            } catch (e: any) {
                console.error("Failed to load resume:", e);
            } finally {
                setIsLoading(false);
                setLoadingMessage("");
            }
        };

        loadResume();
    }, []);

    // Generate recommendations
    const handleGenerateRecommendations = async () => {
        if (!resumeData || !draft.jobAnalysis) return;

        setIsLoading(true);
        setError(null);
        setLoadingMessage("Analyzing your resume against job requirements...");

        try {
            const result = await generateTailoringRecommendations(resumeData, draft.jobAnalysis);

            if (result.error) {
                throw new Error(result.error);
            }

            const recs = result.data || [];
            // Add IDs to recommendations
            const recsWithIds = recs.map((r, i) => ({ ...r, id: r.id || `rec-${i}` }));
            setRecommendations(recsWithIds);

            // Select all high priority by default
            const highPriority = recsWithIds
                .filter(r => r.priority === 'high')
                .map(r => r.id!);
            setSelectedIds(new Set(highPriority));

            onUpdate({
                recommendations: recsWithIds,
                selectedRecommendations: recsWithIds.filter(r => highPriority.includes(r.id!))
            });

        } catch (e: any) {
            setError(e.message || "Failed to generate recommendations");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    // Toggle recommendation selection
    const toggleRecommendation = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);

        // Update draft
        const selectedRecs = recommendations.filter(r => newSelected.has(r.id!));
        onUpdate({
            selectedRecommendations: selectedRecs,
            versionName
        });
    };

    // Select all / none
    const selectAll = () => {
        const allIds = new Set(recommendations.map(r => r.id!));
        setSelectedIds(allIds);
        onUpdate({ selectedRecommendations: recommendations, versionName });
    };

    const selectNone = () => {
        setSelectedIds(new Set());
        onUpdate({ selectedRecommendations: [], versionName });
    };

    // Update version name
    const handleVersionNameChange = (name: string) => {
        setVersionName(name);
        onUpdate({ versionName: name });
    };

    // No resume state
    if (!isLoading && !resumeData) {
        return (
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <WarningCircle size={32} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Resume Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You need to create a resume first before tailoring it for this job application.
                </p>
                <Link href="/resume-builder">
                    <Button className="gap-2">
                        <FileText size={18} />
                        Go to Resume Builder
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Version Name Input */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                <Label htmlFor="versionName" className="text-sm font-medium">Version Name</Label>
                <Input
                    id="versionName"
                    value={versionName}
                    onChange={(e) => handleVersionNameChange(e.target.value)}
                    placeholder="e.g., Google - Senior Engineer"
                    className="mt-2 h-11"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Give this tailored version a name so you can find it later
                </p>
            </div>

            {/* Recommendations Section */}
            {recommendations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 text-center">
                    {isLoading ? (
                        <div className="space-y-4">
                            <CircleNotch size={40} className="animate-spin mx-auto text-primary" />
                            <p className="text-muted-foreground">{loadingMessage}</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkle size={32} className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Tailor Your Resume</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Our AI will compare your resume with the job requirements and suggest specific improvements.
                            </p>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                            <Button
                                onClick={handleGenerateRecommendations}
                                disabled={isLoading || !resumeData}
                                className="gap-2"
                            >
                                <Lightning size={18} weight="fill" />
                                Generate Recommendations
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Header with actions */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Recommended Changes</h3>
                            <p className="text-sm text-muted-foreground">
                                {selectedIds.size} of {recommendations.length} selected
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAll}>
                                Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={selectNone}>
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Recommendations List */}
                    <div className="space-y-3">
                        {recommendations.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                isSelected={selectedIds.has(rec.id!)}
                                onToggle={() => toggleRecommendation(rec.id!)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Recommendation Card Component
interface RecommendationCardProps {
    recommendation: TailoringRecommendation;
    isSelected: boolean;
    onToggle: () => void;
}

function RecommendationCard({ recommendation, isSelected, onToggle }: RecommendationCardProps) {
    const priorityColors = {
        high: "bg-red-50 border-red-200 text-red-700",
        medium: "bg-amber-50 border-amber-200 text-amber-700",
        low: "bg-blue-50 border-blue-200 text-blue-700"
    };

    const categoryIcons: Record<string, string> = {
        summary: "Summary",
        experience: "Experience",
        skills: "Skills",
        competencies: "Competencies"
    };

    return (
        <div
            onClick={onToggle}
            className={cn(
                "bg-white rounded-xl border-2 p-4 cursor-pointer transition-all duration-200",
                isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-border"
            )}
        >
            <div className="flex gap-4">
                {/* Checkbox */}
                <div
                    className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                    )}
                >
                    {isSelected && <Check size={14} weight="bold" className="text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full border",
                            priorityColors[recommendation.priority]
                        )}>
                            {recommendation.priority}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            {categoryIcons[recommendation.category] || recommendation.category}
                        </span>
                    </div>

                    {/* Before/After */}
                    <div className="space-y-2">
                        {recommendation.original && (
                            <div className="text-sm">
                                <span className="text-muted-foreground line-through">
                                    {recommendation.original.length > 100
                                        ? recommendation.original.substring(0, 100) + "..."
                                        : recommendation.original}
                                </span>
                            </div>
                        )}
                        <div className="text-sm flex items-start gap-2">
                            <ArrowRight size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-green-700">
                                {recommendation.suggested.length > 150
                                    ? recommendation.suggested.substring(0, 150) + "..."
                                    : recommendation.suggested}
                            </span>
                        </div>
                    </div>

                    {/* Reasoning */}
                    {recommendation.reasoning && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                            {recommendation.reasoning}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
