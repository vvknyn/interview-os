import React, { useState } from "react";
import { TailoringRecommendation, ResumeData } from "@/types/resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Info, ArrowRight, Save } from "lucide-react";

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
                return 'bg-red-100 text-red-800 border-red-300';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-300';
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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        💡 Tailoring Recommendations
                        <Badge variant="secondary">{recommendations.length} suggestions</Badge>
                    </CardTitle>
                    <Button
                        onClick={() => setShowSaveDialog(!showSaveDialog)}
                        variant="default"
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Version ({acceptedIds.size} applied)
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showSaveDialog && (
                    <Card className="border-purple-300 bg-purple-50">
                        <CardContent className="p-4 space-y-3">
                            <label className="text-sm font-medium">Version Name</label>
                            <Input
                                placeholder="e.g., Google SWE Version"
                                value={versionName}
                                onChange={(e) => setVersionName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleSave} size="sm" className="flex-1">
                                    Save Tailored Version
                                </Button>
                                <Button onClick={() => setShowSaveDialog(false)} size="sm" variant="outline">
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
                        <TabsTrigger value="summary">Summary ({groupedRecs.summary.length})</TabsTrigger>
                        <TabsTrigger value="experience">Experience ({groupedRecs.experience.length})</TabsTrigger>
                        <TabsTrigger value="skills">Skills ({groupedRecs.skills.length})</TabsTrigger>
                        <TabsTrigger value="overall">Strategy ({groupedRecs.overall.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-3 mt-4">
                        {recommendations.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                isAccepted={acceptedIds.has(rec.id)}
                                onToggle={() => toggleAccept(rec.id)}
                                getPriorityIcon={getPriorityIcon}
                                getPriorityColor={getPriorityColor}
                            />
                        ))}
                    </TabsContent>

                    {(['summary', 'experience', 'skills', 'overall'] as const).map((category) => (
                        <TabsContent key={category} value={category} className="space-y-3 mt-4">
                            {groupedRecs[category].map((rec) => (
                                <RecommendationCard
                                    key={rec.id}
                                    recommendation={rec}
                                    isAccepted={acceptedIds.has(rec.id)}
                                    onToggle={() => toggleAccept(rec.id)}
                                    getPriorityIcon={getPriorityIcon}
                                    getPriorityColor={getPriorityColor}
                                />
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

const safeRender = (content: any): string => {
    if (typeof content === 'string') return content;
    if (typeof content === 'number') return String(content);
    if (!content) return "";
    // If it's an object/array (hallucination), try to extract text or stringify
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
    getPriorityColor
}: {
    recommendation: TailoringRecommendation;
    isAccepted: boolean;
    onToggle: () => void;
    getPriorityIcon: (priority: TailoringRecommendation['priority']) => React.ReactNode;
    getPriorityColor: (priority: TailoringRecommendation['priority']) => string;
}) {
    return (
        <Card className={`transition-all ${isAccepted ? 'ring-2 ring-primary/20 bg-primary/5' : 'hover:shadow-md'}`}>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            {getPriorityIcon(recommendation.priority)}
                            <h3 className="font-semibold text-foreground text-lg">{safeRender(recommendation.title)}</h3>
                            <Badge className={`text-xs ml-2 ${getPriorityColor(recommendation.priority)}`}>
                                {safeRender(recommendation.priority)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-base leading-relaxed">{safeRender(recommendation.reasoning)}</p>
                    </div>
                    <Button
                        onClick={onToggle}
                        size="sm"
                        variant={isAccepted ? "default" : "outline"}
                        className="shrink-0"
                    >
                        {isAccepted ? "✓ Applied" : "Apply"}
                    </Button>
                </div>

                {recommendation.original && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</div>
                            <div className="text-sm bg-muted/50 p-4 rounded-md border border-border text-foreground/80 leading-relaxed">
                                {safeRender(recommendation.original)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                                Suggested <ArrowRight className="w-3 h-3" />
                            </div>
                            <div className="text-sm bg-primary/5 p-4 rounded-md border border-primary/10 font-medium text-foreground leading-relaxed">
                                {safeRender(recommendation.suggested)}
                            </div>
                        </div>
                    </div>
                )}

                {!recommendation.original && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider">Suggestion</div>
                        <div className="text-sm bg-primary/5 p-4 rounded-md border border-primary/10 font-medium text-foreground leading-relaxed">
                            {safeRender(recommendation.suggested)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
