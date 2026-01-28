"use client";

import { useEffect, useState } from "react";
import { ResumeData, ResumeCompetencyCategory } from "@/types/resume";
import { inferCompetenciesFromExperience } from "@/lib/mock-ai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillsEngineProps {
    data: ResumeData;
    update: (data: Partial<ResumeData>) => void;
}

export function SkillsEngine({ data, update }: SkillsEngineProps) {
    const [loading, setLoading] = useState(false);
    const [inferred, setInferred] = useState(false);

    useEffect(() => {
        // Auto-infer if empty
        if (data.competencies.length === 0 && !loading && !inferred) {
            inferSkills();
        }
    }, []);

    const inferSkills = async () => {
        setLoading(true);
        try {
            const result = await inferCompetenciesFromExperience(
                data.profile.profession,
                data.experience
            );
            update({ competencies: result });
            setInferred(true);
        } catch (error) {
            console.error("Failed to infer skills", error);
        } finally {
            setLoading(false);
        }
    };

    const updateCategoryName = (index: number, name: string) => {
        const newCompetencies = [...data.competencies];
        newCompetencies[index].category = name;
        update({ competencies: newCompetencies });
    };

    const updateSkills = (index: number, value: string) => {
        const newCompetencies = [...data.competencies];
        // Split by comma, trim whitespace
        newCompetencies[index].skills = value.split(",").map(s => s.trim());
        update({ competencies: newCompetencies });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div>
                    <h3 className="text-xl font-medium">Analyzing your experience...</h3>
                    <p className="text-gray-500">Our AI is extracting relevant core competencies.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Core Competencies</h2>
                    <p className="text-gray-500">
                        Categorize your skills to help recruiters digest your expertise quickly.
                    </p>
                </div>
                <Button variant="outline" onClick={inferSkills} disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-infer
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                {data.competencies.map((cat, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                Category {index + 1}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="md:col-span-1 space-y-2">
                                    <Label>Category Name</Label>
                                    <Input
                                        value={cat.category}
                                        onChange={(e) => updateCategoryName(index, e.target.value)}
                                        placeholder="e.g. Languages"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Skills (Comma separated)</Label>
                                    <Input
                                        value={cat.skills.join(", ")}
                                        onChange={(e) => updateSkills(index, e.target.value)}
                                        placeholder="e.g. Java, Python, C++"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {data.competencies.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    No competencies found. Click "Re-infer" or go back to add details.
                </div>
            )}
        </div>
    );
}
