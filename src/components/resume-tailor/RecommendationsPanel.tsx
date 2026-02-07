import React, { useState } from "react";
import { TailoringRecommendation, ResumeData } from "@/types/resume";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Warning, CheckCircle, Info, ArrowRight, FloppyDisk, X, FileText, Briefcase, Sparkle, Target, Check } from "@phosphor-icons/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogOverlay,
    DialogPortal
} from "@/components/ui/dialog";

import { getPriorityIcon, getPriorityColor, getCategoryIcon } from "./recommendation-utils";

interface RecommendationsPanelProps {
    recommendations: TailoringRecommendation[];
    resumeData: ResumeData;
    onSaveVersion: (versionName: string, appliedRecommendations: TailoringRecommendation[]) => void;
    existingVersionName?: string; // If editing an existing version
    isUpdating?: boolean; // Whether this is an update vs new creation
}

export function RecommendationsPanel({ recommendations, resumeData, onSaveVersion, existingVersionName, isUpdating }: RecommendationsPanelProps) {
    const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
    const [versionName, setVersionName] = useState(existingVersionName || "");
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const [isSaved, setIsSaved] = useState(false);

    const toggleAccept = (id: string) => {
        const newSet = new Set(acceptedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setAcceptedIds(newSet);
    };

    const handleSave = () => {
        const appliedRecs = recommendations.filter(r => acceptedIds.has(r.id));
        onSaveVersion(versionName || `Tailored Version ${new Date().toLocaleDateString()}`, appliedRecs);

        // Show success state
        setIsSaved(true);
        setShowSaveDialog(false);
        setVersionName("");

        // Reset success state after 2 seconds
        setTimeout(() => setIsSaved(false), 2000);
    };

    // ... (keep getPriorityIcon, getPriorityColor, getCategoryIcon) ...

    const groupedRecs = {
        summary: recommendations.filter(r => r.category === 'summary'),
        experience: recommendations.filter(r => r.category === 'experience'),
        skills: recommendations.filter(r => r.category === 'skills'),
        overall: recommendations.filter(r => r.category === 'overall')
    };

    if (recommendations.length === 0) {
        // ... (keep empty state) ...
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkle size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Recommendations Yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Analyze a job posting and generate recommendations to see tailoring suggestions here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogPortal>
                    <DialogOverlay className="!z-[100]" />
                    <DialogContent className="bg-background !z-[100]">
                        <DialogHeader>
                            <DialogTitle>{isUpdating ? 'Update Version' : 'Save Tailored Version'}</DialogTitle>
                            <DialogDescription>
                                {isUpdating
                                    ? `Update "${existingVersionName}" with ${acceptedIds.size} selected recommendations.`
                                    : `Create a snapshot of this resume with ${acceptedIds.size} selected recommendations applied.`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Version Name</label>
                                <Input
                                    placeholder="e.g., Google SWE Application"
                                    value={versionName}
                                    onChange={(e) => setVersionName(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                {isUpdating ? 'Update Version' : 'Save Version'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPortal>
            </Dialog>

            {/* Tabs */}
            <Tabs defaultValue="all" className="flex flex-col flex-1 min-h-0">
                {/* Sticky header with tabs and save button */}
                <div className="sticky top-0 z-10 px-4 py-2.5 bg-background shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
                            <TabsTrigger value="all" className="text-xs flex-shrink-0 h-7 px-2">
                                All ({recommendations.length})
                            </TabsTrigger>
                            <TabsTrigger value="summary" className="text-xs flex-shrink-0 h-7 px-2">
                                Summary ({groupedRecs.summary.length})
                            </TabsTrigger>
                            <TabsTrigger value="experience" className="text-xs flex-shrink-0 h-7 px-2">
                                Exp ({groupedRecs.experience.length})
                            </TabsTrigger>
                            <TabsTrigger value="skills" className="text-xs flex-shrink-0 h-7 px-2">
                                Skills ({groupedRecs.skills.length})
                            </TabsTrigger>
                            <TabsTrigger value="overall" className="text-xs flex-shrink-0 h-7 px-2">
                                Strat ({groupedRecs.overall.length})
                            </TabsTrigger>
                        </TabsList>

                        <Button
                            onClick={() => setShowSaveDialog(true)}
                            size="sm"
                            variant={acceptedIds.size > 0 ? "default" : "outline"}
                            className={`h-8 shadow-sm transition-all duration-300 shrink-0 ${isSaved ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}`}
                        >
                            {isSaved ? (
                                <>
                                    <Check size={16} className="mr-1.5" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <FloppyDisk size={16} className="mr-1.5" />
                                    Save
                                    {acceptedIds.size > 0 && (
                                        <Badge variant="secondary" className="ml-1.5 bg-primary-foreground/20 text-[10px] px-1 h-4 min-w-[1.2rem]">
                                            {acceptedIds.size}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="all" className="mt-0 p-4 space-y-3">
                        {recommendations.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                isAccepted={acceptedIds.has(rec.id)}
                                onToggle={() => toggleAccept(rec.id)}
                                getPriorityIcon={getPriorityIcon}
                                getPriorityColor={getPriorityColor}
                                getCategoryIcon={getCategoryIcon}
                            />
                        ))}
                    </TabsContent>

                    {(['summary', 'experience', 'skills', 'overall'] as const).map((category) => (
                        <TabsContent key={category} value={category} className="mt-0 p-4 space-y-3">
                            {groupedRecs[category].length > 0 ? (
                                groupedRecs[category].map((rec) => (
                                    <RecommendationCard
                                        key={rec.id}
                                        recommendation={rec}
                                        isAccepted={acceptedIds.has(rec.id)}
                                        onToggle={() => toggleAccept(rec.id)}
                                        getPriorityIcon={getPriorityIcon}
                                        getPriorityColor={getPriorityColor}
                                        getCategoryIcon={getCategoryIcon}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="text-sm">No {category} recommendations</p>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>

            {/* Sticky Footer */}
            <div className="bg-background px-4 py-3 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
                <Button
                    onClick={() => setShowSaveDialog(true)}
                    className={`w-full transition-all duration-300 ${isSaved ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                    variant={acceptedIds.size > 0 ? "default" : "outline"}
                    size="sm"
                >
                    {isSaved ? (
                        <>
                            <Check size={16} className="mr-2" />
                            {isUpdating ? 'Updated!' : 'Saved!'}
                        </>
                    ) : (
                        <>
                            <FloppyDisk size={16} className="mr-2" />
                            {isUpdating ? 'Update Version' : 'Save Version'}
                            {acceptedIds.size > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-xs">
                                    {acceptedIds.size} selected
                                </Badge>
                            )}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

const safeRender = (content: any): string => {
    if (typeof content === 'string') return content;
    if (typeof content === 'number') return String(content);
    if (!content) return "";
    if (typeof content === 'object') {
        if (content.text) return String(content.text);
        if (content.content) return String(content.content);
        return JSON.stringify(content);
    }
    return String(content);
};

function RecommendationCard({
    recommendation,
    isAccepted,
    onToggle,
    getPriorityIcon,
    getPriorityColor,
    getCategoryIcon
}: {
    recommendation: TailoringRecommendation;
    isAccepted: boolean;
    onToggle: () => void;
    getPriorityIcon: (priority: TailoringRecommendation['priority']) => React.ReactNode;
    getPriorityColor: (priority: TailoringRecommendation['priority']) => string;
    getCategoryIcon: (category: TailoringRecommendation['category']) => React.ReactNode;
}) {
    return (
        <Card className={`transition-all duration-200 ${isAccepted ? 'ring-2 ring-brand/30 bg-brand/5 shadow-md' : 'hover:shadow-md'}`}>
            <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {getPriorityIcon(recommendation.priority)}
                            <h3 className="font-semibold text-foreground">{safeRender(recommendation.title)}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                {getCategoryIcon(recommendation.category)}
                                <span className="ml-1 capitalize">{recommendation.category}</span>
                            </Badge>
                            <Badge className={`text-[10px] px-2 py-0.5 ${getPriorityColor(recommendation.priority)}`}>
                                {safeRender(recommendation.priority)} priority
                            </Badge>
                        </div>
                    </div>
                    <Button
                        onClick={onToggle}
                        size="sm"
                        variant={isAccepted ? "default" : "outline"}
                        className="shrink-0 h-8"
                    >
                        {isAccepted ? (
                            <>
                                <CheckCircle size={14} className="mr-1.5" />
                                Applied
                            </>
                        ) : (
                            "Apply"
                        )}
                    </Button>
                </div>

                {/* Reasoning */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {safeRender(recommendation.reasoning)}
                </p>

                {/* Original vs Suggested */}
                {recommendation.original && (
                    <div className="grid grid-cols-1 gap-4 pt-3">
                        <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Original
                            </div>
                            <div className="text-sm bg-muted/50 p-3 rounded-lg text-foreground/80 leading-relaxed">
                                {safeRender(recommendation.original)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-brand uppercase tracking-wider flex items-center gap-1">
                                <ArrowRight size={12} />
                                Suggested
                            </div>
                            <div className="text-sm bg-brand/5 p-3 rounded-lg font-medium text-foreground leading-relaxed">
                                {safeRender(recommendation.suggested)}
                            </div>
                        </div>
                    </div>
                )}

                {!recommendation.original && recommendation.suggested && (
                    <div className="pt-3 space-y-2">
                        <div className="text-[10px] font-semibold text-brand uppercase tracking-wider">
                            Suggestion
                        </div>
                        <div className="text-sm bg-brand/5 p-3 rounded-lg font-medium text-foreground leading-relaxed">
                            {safeRender(recommendation.suggested)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
