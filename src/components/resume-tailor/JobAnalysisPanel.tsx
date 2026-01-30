import { JobAnalysis } from "@/types/resume";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, Users, CheckCircle2, Target, Sparkles } from "lucide-react";

export function JobAnalysisPanel({ analysis }: { analysis: JobAnalysis }) {
    return (
        <div className="space-y-6">
            {/* Company & Position Hero Section */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl p-6 border border-primary/10">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-bold text-foreground truncate">
                                {analysis.companyName}
                            </h2>
                            <p className="text-lg text-muted-foreground mt-1">
                                {analysis.positionTitle}
                            </p>
                        </div>
                    </div>

                    {analysis.seniorityLevel && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                {analysis.seniorityLevel}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Requirements */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold">Key Requirements</h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                        {analysis.extractedRequirements?.length || 0} items
                    </Badge>
                </div>
                <ul className="space-y-2.5 pl-1">
                    {analysis.extractedRequirements?.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 group">
                            <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm leading-relaxed text-foreground/85">{req}</span>
                        </li>
                    )) || (
                        <li className="text-sm text-muted-foreground italic">No requirements extracted</li>
                    )}
                </ul>
            </section>

            {/* Required Skills */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold">Required Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {analysis.extractedSkills?.length > 0 ? (
                        analysis.extractedSkills.map((skill, i) => (
                            <Badge
                                key={i}
                                variant="secondary"
                                className="px-3 py-1.5 text-sm font-medium bg-secondary/80 hover:bg-secondary transition-colors cursor-default"
                            >
                                {skill}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground italic">No skills extracted</span>
                    )}
                </div>
            </section>

            {/* Culture Indicators */}
            {analysis.cultureIndicators?.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        <h3 className="text-base font-semibold">Culture & Values</h3>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        {analysis.cultureIndicators.map((culture, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                                <span className="text-sm leading-relaxed text-muted-foreground">
                                    {culture}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
