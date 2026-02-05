"use client";

import { ResumeData, ResumeExperience } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, Plus, CaretUp, CaretDown, Briefcase, Lightbulb } from "@phosphor-icons/react";

interface ExperienceBuilderProps {
    data: ResumeData;
    update: (data: Partial<ResumeData>) => void;
}

export function ExperienceBuilder({ data, update }: ExperienceBuilderProps) {
    const experiences = data.experience;

    const addExperience = () => {
        const newExperience: ResumeExperience = {
            id: crypto.randomUUID(),
            company: "",
            role: "",
            dates: "",
            description: "",
        };
        update({ experience: [...experiences, newExperience] });
    };

    const removeExperience = (id: string) => {
        update({ experience: experiences.filter((exp) => exp.id !== id) });
    };

    const updateExperience = (id: string, field: keyof ResumeExperience, value: string) => {
        update({
            experience: experiences.map((exp) =>
                exp.id === id ? { ...exp, [field]: value } : exp
            ),
        });
    };

    const moveExperience = (index: number, direction: 'up' | 'down') => {
        const newExperiences = [...experiences];
        if (direction === 'up' && index > 0) {
            [newExperiences[index], newExperiences[index - 1]] = [newExperiences[index - 1], newExperiences[index]];
        } else if (direction === 'down' && index < newExperiences.length - 1) {
            [newExperiences[index], newExperiences[index + 1]] = [newExperiences[index + 1], newExperiences[index]];
        }
        update({ experience: newExperiences });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string, currentVal: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const selectionStart = textarea.selectionStart;
            const selectionEnd = textarea.selectionEnd;

            const before = currentVal.substring(0, selectionStart);
            const after = currentVal.substring(selectionEnd);

            // Check if the current line (before cursor) starts with a bullet
            const lastLineIndex = before.lastIndexOf('\n');
            const currentLine = lastLineIndex === -1 ? before : before.substring(lastLineIndex + 1);
            const isBulletList = currentLine.trim().startsWith('•') || currentLine.trim().startsWith('-');

            let insertion = '\n';
            if (isBulletList) {
                insertion = '\n• ';
            } else if (currentLine.trim().length === 0) {
                // specific case: if empty line, maybe don't add bullet? Or force bullet?
                // standard behavior: just new line.
                insertion = '\n• '; // Encourage bullets
            }

            const newValue = before + insertion + after;

            updateExperience(id, "description", newValue);

            // Restore cursor position on next render
            // This is a bit hacky in standard React without refs/flushSync, but works for basic cases
            requestAnimationFrame(() => {
                textarea.selectionStart = selectionStart + insertion.length;
                textarea.selectionEnd = selectionStart + insertion.length;
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end pb-2">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Briefcase size={22} className="text-primary" />
                        Professional Experience
                    </h2>
                    <p className="text-sm text-muted-foreground/80">
                        Focus on quantifiable impact and leadership.
                    </p>
                </div>
                <Button onClick={addExperience} size="sm" className="gap-1.5 shadow-sm">
                    <Plus size={16} weight="bold" />
                    Add Position
                </Button>
            </div>

            <div className="space-y-6">
                {experiences.length === 0 && (
                    <div
                        className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={addExperience}
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Briefcase size={24} weight="fill" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No experience listed yet</h3>
                        <p className="text-muted-foreground text-sm mb-4 max-w-xs mx-auto">
                            Add your past roles to highlight your career growth and achievements.
                        </p>
                        <Button variant="outline" size="sm">Add First Position</Button>
                    </div>
                )}

                {experiences.map((exp, index) => (
                    <Card key={exp.id} className="group border-border/60 hover:border-border transition-all shadow-sm">
                        <CardContent className="p-5 space-y-5">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold border border-border">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-medium text-base text-foreground/90">
                                        {exp.role || "Untitled Role"} {exp.company ? <span className="text-muted-foreground">at {exp.company}</span> : ""}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        disabled={index === 0}
                                        onClick={() => moveExperience(index, 'up')}
                                        title="Move Up"
                                    >
                                        <CaretUp size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        disabled={index === experiences.length - 1}
                                        onClick={() => moveExperience(index, 'down')}
                                        title="Move Down"
                                    >
                                        <CaretDown size={16} />
                                    </Button>
                                    <div className="w-px h-4 bg-border mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeExperience(exp.id)}
                                        title="Remove"
                                    >
                                        <Trash size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Company</Label>
                                    <Input
                                        placeholder="Company Name"
                                        value={exp.company}
                                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                        className="font-medium bg-background/50 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Role</Label>
                                    <Input
                                        placeholder="Job Title"
                                        value={exp.role}
                                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                        className="bg-background/50 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Dates</Label>
                                    <Input
                                        placeholder="e.g. Jan 2020 - Present"
                                        value={exp.dates}
                                        onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                                        className="bg-background/50 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Description & Impact</Label>
                                        <span className="text-[10px] text-muted-foreground/70 bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
                                            Auto-bullets on Enter
                                        </span>
                                    </div>

                                    <Textarea
                                        placeholder={`• Led a team of 5 engineers...\n• Increased revenue by 20%...\n• Spearheaded the migration to...`}
                                        className="min-h-[160px] font-mono text-sm leading-relaxed bg-background/50 focus:bg-background resize-y"
                                        value={exp.description}
                                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, exp.id, exp.description)}
                                    />

                                    {/* Subtler Impact Tip */}
                                    <div className="text-xs text-muted-foreground/80 flex gap-2 items-start bg-blue-50/30 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-900/30">
                                        <Lightbulb size={16} className="text-blue-500 fill-blue-500 flex-shrink-0 mt-0.5" weight="fill" />
                                        <div className="space-y-1">
                                            <p className="font-medium text-blue-700 dark:text-blue-400">The Impact Formula</p>
                                            <p>Start with a <span className="font-semibold">Strong Action Verb</span> + <span className="font-semibold">Specific Task</span> + <span className="font-semibold">Quantifiable Result</span>.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {experiences.length > 0 && (
                <Button onClick={addExperience} variant="outline" className="w-full py-6 border-dashed border-border/60 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all">
                    <Plus size={16} weight="bold" className="mr-2" />
                    Add Another Position
                </Button>
            )}
        </div>
    );
}
