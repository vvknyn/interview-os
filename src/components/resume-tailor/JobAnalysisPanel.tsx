import { JobAnalysis } from "@/types/resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, Users, CheckCircle2, TrendingUp } from "lucide-react";

export function JobAnalysisPanel({ analysis }: { analysis: JobAnalysis }) {
    return (
        <Card className="border-border shadow-sm bg-card transition-all">
            <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Job Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wide">
                            <Building2 className="w-4 h-4" /> Company
                        </div>
                        <div className="font-semibold text-lg">{analysis.companyName}</div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wide">
                            <Briefcase className="w-4 h-4" /> Position
                        </div>
                        <div className="font-semibold text-lg">{analysis.positionTitle}</div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wide">
                            <Users className="w-4 h-4" /> Seniority
                        </div>
                        <div className="font-semibold text-lg">{analysis.seniorityLevel}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">Key Requirements</h3>
                    <ul className="space-y-3">
                        {analysis.extractedRequirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm md:text-base leading-relaxed text-foreground/90">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span>{req}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {analysis.extractedSkills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">Culture Indicators</h3>
                    <ul className="grid grid-cols-1 gap-3">
                        {analysis.cultureIndicators.map((culture, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm md:text-base leading-relaxed text-muted-foreground italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                                <span>{culture}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
