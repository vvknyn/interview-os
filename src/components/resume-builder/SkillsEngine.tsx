"use client";

import { useEffect, useState } from "react";
import { ResumeData, ResumeCompetencyCategory } from "@/types/resume";
import { inferCompetenciesFromExperience } from "@/lib/mock-ai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MagicWand, Tag, X, Sparkle, CircleNotch, Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface SkillsEngineProps {
    data: ResumeData;
    update: (data: Partial<ResumeData>) => void;
}

export function SkillsEngine({ data, update }: SkillsEngineProps) {
    const [loading, setLoading] = useState(false);
    const [inferred, setInferred] = useState(false);

    useEffect(() => {
        // Auto-infer if empty AND we have enough context
        const hasProfession = data.profile.profession && data.profile.profession.trim().length > 2;
        const hasExperience = data.experience.length > 0;

        if (data.competencies.length === 0 && !loading && !inferred && (hasProfession || hasExperience)) {
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

    const addCategory = () => {
        update({
            competencies: [
                ...data.competencies,
                { category: "New Category", skills: [] }
            ]
        });
    };

    const removeCategory = (index: number) => {
        const newCompetencies = [...data.competencies];
        newCompetencies.splice(index, 1);
        update({ competencies: newCompetencies });
    };

    const updateCategoryName = (index: number, name: string) => {
        const newCompetencies = [...data.competencies];
        newCompetencies[index].category = name;
        update({ competencies: newCompetencies });
    };

    const addSkill = (index: number, skillToAdd: string) => {
        const trimmed = skillToAdd.trim();
        if (!trimmed) return;

        const newCompetencies = [...data.competencies];
        // Avoid duplicates in the same category
        if (!newCompetencies[index].skills.includes(trimmed)) {
            newCompetencies[index].skills.push(trimmed);
            update({ competencies: newCompetencies });
        }
    };

    const removeSkill = (catIndex: number, skillIndex: number) => {
        const newCompetencies = [...data.competencies];
        newCompetencies[catIndex].skills.splice(skillIndex, 1);
        update({ competencies: newCompetencies });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end pb-2">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Sparkle size={22} className="text-primary" weight="fill" />
                        Core Competencies
                    </h2>
                    <p className="text-sm text-muted-foreground/80">
                        Categorize your skills to help recruiters digest your expertise quickly.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={addCategory} className="text-muted-foreground hover:text-foreground">
                        <Plus size={16} className="mr-1.5" />
                        Add Category
                    </Button>
                    <Button variant="outline" onClick={inferSkills} disabled={loading} size="sm" className="gap-2 shadow-sm">
                        {loading ? <CircleNotch size={16} className="animate-spin" /> : <MagicWand size={16} />}
                        {data.competencies.length > 0 ? "Re-infer with AI" : "Auto-Generate"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {data.competencies.map((cat, index) => (
                    <Card key={index} className="border-l-4 border-l-primary/50 overflow-visible shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="pb-3 pt-5 px-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-md text-primary">
                                    <Tag size={18} weight="bold" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Category Name</Label>
                                    <Input
                                        value={cat.category}
                                        onChange={(e) => updateCategoryName(index, e.target.value)}
                                        placeholder="e.g. Languages"
                                        className="h-8 font-semibold text-base border-transparent hover:border-border focus:border-input px-0 -ml-1.5 focus:pl-2 transition-all bg-transparent w-full max-w-sm"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCategory(index)}
                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                >
                                    <Trash size={16} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0">
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-1.5 bg-secondary/20 rounded-lg border border-transparent focus-within:border-primary/20 transition-all">
                                    {cat.skills.map((skill, sIndex) => (
                                        <span
                                            key={sIndex}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/50 text-foreground rounded-full text-sm font-medium group transition-all hover:border-primary/50 hover:shadow-sm"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(index, sIndex)}
                                                className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-0.5"
                                            >
                                                <X size={12} weight="bold" />
                                            </button>
                                        </span>
                                    ))}

                                    <Input
                                        placeholder="+ Add skill (Hit Enter)"
                                        className="inline-flex w-[180px] h-8 bg-transparent border-transparent hover:border-border focus:border-transparent shadow-none text-sm px-2 rounded-full !mt-0 !ring-0 placeholder:text-muted-foreground/50"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill(index, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {data.competencies.length === 0 && (
                <div
                    className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={inferSkills}
                >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                        <MagicWand size={24} weight="fill" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No competencies defined</h3>
                    <p className="text-muted-foreground text-sm mb-4 max-w-xs mx-auto">
                        Manually categorize your skills or let AI extract them from your experience.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addCategory(); }}>
                            Manual Entry
                        </Button>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); inferSkills(); }}>
                            <Sparkle size={16} className="mr-2" weight="fill" />
                            Auto-Generate
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
