"use client";

import { ResumeData, ResumeExperience } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkle, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";

interface EditingPanelProps {
    selectedSection: string | null;
    data: ResumeData;
    onUpdate: (updates: Partial<ResumeData>) => void;
    onGenerateWithAI?: (section: string) => void;
}

export function EditingPanel({ selectedSection, data, onUpdate, onGenerateWithAI }: EditingPanelProps) {
    if (!selectedSection) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8 text-muted-foreground">
                <div className="w-full max-w-sm space-y-4">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                        <Sparkle size={32} weight="duotone" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Welcome to your resume builder</h3>
                    <p className="text-sm">
                        Click any section on the left to start editing. We'll guide you through creating a professional resume.
                    </p>
                </div>
            </div>
        );
    }

    // Header/Contact Info Section
    if (selectedSection === "header") {
        return (
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Contact Information</h2>
                    <p className="text-sm text-muted-foreground">
                        Add your professional contact details
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Jane Smith"
                            value={data.profile.profession || ""}
                            onChange={(e) => onUpdate({
                                profile: { ...data.profile, profession: e.target.value }
                            })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jane@example.com"
                                value={data.profile.email || ""}
                                onChange={(e) => onUpdate({
                                    profile: { ...data.profile, email: e.target.value }
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={data.profile.phone || ""}
                                onChange={(e) => onUpdate({
                                    profile: { ...data.profile, phone: e.target.value }
                                })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            placeholder="e.g., San Francisco, CA"
                            value={data.profile.location || ""}
                            onChange={(e) => onUpdate({
                                profile: { ...data.profile, location: e.target.value }
                            })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                            id="linkedin"
                            placeholder="linkedin.com/in/yourprofile"
                            value={data.profile.linkedin || ""}
                            onChange={(e) => onUpdate({
                                profile: { ...data.profile, linkedin: e.target.value }
                            })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Professional Summary Section
    if (selectedSection === "summary") {
        return (
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">Professional Summary</h2>
                    <p className="text-sm text-muted-foreground">
                        A brief overview of your experience and expertise
                    </p>
                </div>

                <div className="space-y-4">
                    <Textarea
                        placeholder="Write a compelling 2-3 sentence summary of your professional background..."
                        value={data.generatedSummary || ""}
                        onChange={(e) => onUpdate({ generatedSummary: e.target.value })}
                        className="min-h-[120px]"
                    />

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => onGenerateWithAI?.("summary")}
                    >
                        <Sparkle size={16} weight="fill" className="mr-2" />
                        Generate with AI
                    </Button>

                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                        <p className="font-medium">Tips for a strong summary:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Highlight your most relevant experience</li>
                            <li>Include key skills and achievements</li>
                            <li>Keep it concise (2-3 sentences)</li>
                            <li>Tailor it to your target role</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Experience Section
    if (selectedSection === "experience") {
        const addExperience = () => {
            const newExp: ResumeExperience = {
                id: crypto.randomUUID(),
                company: "",
                role: "",
                dates: "",
                description: "",
            };
            onUpdate({ experience: [...(data.experience || []), newExp] });
        };

        const updateExperience = (id: string, field: keyof ResumeExperience, value: string) => {
            onUpdate({
                experience: (data.experience || []).map(exp =>
                    exp.id === id ? { ...exp, [field]: value } : exp
                )
            });
        };

        const removeExperience = (id: string) => {
            onUpdate({
                experience: (data.experience || []).filter(exp => exp.id !== id)
            });
        };

        return (
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Work Experience</h2>
                        <p className="text-sm text-muted-foreground">
                            Add your professional experience
                        </p>
                    </div>
                    <Button onClick={addExperience} size="sm">
                        <Plus size={16} weight="bold" className="mr-1" />
                        Add
                    </Button>
                </div>

                {(!data.experience || data.experience.length === 0) ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-4">No experience added yet</p>
                        <Button onClick={addExperience} variant="outline">
                            <Plus size={16} weight="bold" className="mr-2" />
                            Add your first position
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.experience.map((exp, index) => (
                            <div key={exp.id} className="border border-border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium">Position {index + 1}</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeExperience(exp.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash size={16} weight="bold" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <Input
                                            placeholder="e.g., Senior Product Manager"
                                            value={exp.role}
                                            onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input
                                            placeholder="e.g., Google"
                                            value={exp.company}
                                            onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Dates</Label>
                                    <Input
                                        placeholder="e.g., Jan 2020 - Present"
                                        value={exp.dates}
                                        onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Key Accomplishments</Label>
                                    <Textarea
                                        placeholder="Describe your key achievements and responsibilities... Use bullet points starting with action verbs."
                                        value={exp.description}
                                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                                        className="min-h-[100px] font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => onGenerateWithAI?.(`experience-${exp.id}`)}
                                    >
                                        <Sparkle size={14} weight="fill" className="mr-2" />
                                        Help me write this with AI
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
