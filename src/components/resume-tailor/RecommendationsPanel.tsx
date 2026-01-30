import React, { useState } from "react";
import { TailoringRecommendation, ResumeData } from "@/types/resume";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Info, ArrowRight, Save, X, FileText, Briefcase, Sparkles, Target } from "lucide-react";

interface RecommendationsPanelProps {
    recommendations: TailoringRecommendation[];
    resumeData: ResumeData;
    onSaveVersion: (versionName: string, appliedRecommendations: TailoringRecommendation[]) => void;
}

export function RecommendationsPanel({ recommendations, resumeData, onSaveVersion }: RecommendationsPanelProps) {
    const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
    const [versionName, setVersionName] = useState("");
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const toggleAccept = (id: string) => {
        const newSet = new Set(acceptedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setAcceptedIds(newSet);
    };

    const getPriorityIcon = (priority: TailoringRecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'medium':
                return <Info className="w-4 h-4 text-yellow-500" />;
            case 'low':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        }
    };

    const getPriorityColor = (priority: TailoringRecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800';
        }
    };

    const getCategoryIcon = (category: TailoringRecommendation['category']) => {
        switch (category) {
            case 'summary':
                return <FileText className="w-3.5 h-3.5" />;
            case 'experience':
                return <Briefcase className="w-3.5 h-3.5" />;
            case 'skills':
                return <Sparkles className="w-3.5 h-3.5" />;
            case 'overall':
                return <Target className="w-3.5 h-3.5" />;
            default:
                return <Info className="w-3.5 h-3.5" />;
        }
    };

    const groupedRecs = {
        summary: recommendations.filter(r => r.category === 'summary'),
        experience: recommendations.filter(r => r.category === 'experience'),
        skills: recommendations.filter(r => r.category === 'skills'),
        overall: recommendations.filter(r => r.category === 'overall')
    };

    const handleSave = () => {
        const appliedRecs = recommendations.filter(r => acceptedIds.has(r.id));
        onSaveVersion(versionName || `Tailored Version ${new Date().toLocaleDateString()}`, appliedRecs);
        setShowSaveDialog(false);
        setVersionName("");
    };

    if (recommendations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50" />
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
            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="px-6 py-4 bg-primary/5 border-b">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Save as Version</label>
                            <button onClick={() => setShowSaveDialog(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <Input
                            placeholder="e.g., Google SWE Version"
                            value={versionName}
                            onChange={(e) => setVersionName(e.target.value)}
                            className="bg-background"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSave} size="sm" className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                Save Version
                            </Button>
                            <Button onClick={() => setShowSaveDialog(false)} size="sm" variant="outline">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="all" className="flex flex-col flex-1">
                <div className="px-6 py-3 border-b bg-muted/30">
                    <TabsList className="grid w-full grid-cols-5 h-9">
                        <TabsTrigger value="all" className="text-xs">
                            All ({recommendations.length})
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="text-xs">
                            Summary ({groupedRecs.summary.length})
                        </TabsTrigger>
                        <TabsTrigger value="experience" className="text-xs">
                            Experience ({groupedRecs.experience.length})
                        </TabsTrigger>
                        <TabsTrigger value="skills" className="text-xs">
                            Skills ({groupedRecs.skills.length})
                        </TabsTrigger>
                        <TabsTrigger value="overall" className="text-xs">
                            Strategy ({groupedRecs.overall.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="all" className="mt-0 p-6 space-y-4">
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
                        <TabsContent key={category} value={category} className="mt-0 p-6 space-y-4">
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
            <div className="border-t bg-white dark:bg-neutral-950 px-6 py-4">
                <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="w-full"
                    variant={acceptedIds.size > 0 ? "default" : "outline"}
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Version
                    {acceptedIds.size > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-primary-foreground/20">
                            {acceptedIds.size} applied
                        </Badge>
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
        <Card className={`transition-all duration-200 ${isAccepted ? 'ring-2 ring-primary/30 bg-primary/5 shadow-md' : 'hover:shadow-md hover:border-border/80'}`}>
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
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
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
                    <div className="grid grid-cols-1 gap-4 pt-3 border-t border-border/50">
                        <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Original
                            </div>
                            <div className="text-sm bg-muted/50 p-3 rounded-lg border border-border/50 text-foreground/80 leading-relaxed">
                                {safeRender(recommendation.original)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                Suggested
                            </div>
                            <div className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20 font-medium text-foreground leading-relaxed">
                                {safeRender(recommendation.suggested)}
                            </div>
                        </div>
                    </div>
                )}

                {!recommendation.original && recommendation.suggested && (
                    <div className="pt-3 border-t border-border/50 space-y-2">
                        <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                            Suggestion
                        </div>
                        <div className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20 font-medium text-foreground leading-relaxed">
                            {safeRender(recommendation.suggested)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
