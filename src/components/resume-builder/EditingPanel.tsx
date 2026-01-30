"use client";

import { ResumeData, ResumeExperience, ResumeCompetencyCategory, ResumeEducation } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkle, Plus, Trash, X } from "@phosphor-icons/react";
import { useState } from "react";

interface EditingPanelProps {
    selectedSection: string | null;
    data: ResumeData;
    onUpdate: (updates: Partial<ResumeData>) => void;
    onGenerateWithAI?: (section: string) => void;
}

export function EditingPanel({ selectedSection, data, onUpdate, onGenerateWithAI }: EditingPanelProps) {
    const [newSkill, setNewSkill] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
                            placeholder="Your full name"
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
                                placeholder="your.email@example.com"
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
                                placeholder="Your phone number"
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
                            placeholder="City, State/Province"
                            value={data.profile.location || ""}
                            onChange={(e) => onUpdate({
                                profile: { ...data.profile, location: e.target.value }
                            })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
                        <Input
                            id="linkedin"
                            placeholder="linkedin.com/in/yourprofile"
                            value={data.profile.linkedin || ""}
                            onChange={(e) => onUpdate({
                                profile: { ...data.profile, linkedin: e.target.value }
                            })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                            id="experience"
                            type="number"
                            min="0"
                            max="50"
                            placeholder="Total years in your field"
                            value={data.profile.yearsOfExperience || ""}
                            onChange={(e) => onUpdate({
                                profile: { ...data.profile, yearsOfExperience: parseInt(e.target.value) || 0 }
                            })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Helps optimize your resume layout. New graduates get education-first layouts.
                        </p>
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

    // Skills/Competencies Section
    if (selectedSection === "skills") {
        const addCategory = () => {
            const newCategory: ResumeCompetencyCategory = {
                category: "New Category",
                skills: []
            };
            onUpdate({ competencies: [...(data.competencies || []), newCategory] });
        };

        const updateCategoryName = (index: number, name: string) => {
            const updated = [...(data.competencies || [])];
            updated[index] = { ...updated[index], category: name };
            onUpdate({ competencies: updated });
        };

        const removeCategory = (index: number) => {
            const updated = (data.competencies || []).filter((_, i) => i !== index);
            onUpdate({ competencies: updated });
        };

        const addSkillToCategory = (categoryIndex: number, skill: string) => {
            if (!skill.trim()) return;
            const updated = [...(data.competencies || [])];
            updated[categoryIndex] = {
                ...updated[categoryIndex],
                skills: [...updated[categoryIndex].skills, skill.trim()]
            };
            onUpdate({ competencies: updated });
            setNewSkill("");
        };

        const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
            const updated = [...(data.competencies || [])];
            updated[categoryIndex] = {
                ...updated[categoryIndex],
                skills: updated[categoryIndex].skills.filter((_, i) => i !== skillIndex)
            };
            onUpdate({ competencies: updated });
        };

        return (
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Core Competencies</h2>
                        <p className="text-sm text-muted-foreground">
                            Organize your skills by category
                        </p>
                    </div>
                    <Button onClick={addCategory} size="sm">
                        <Plus size={16} weight="bold" className="mr-1" />
                        Add Category
                    </Button>
                </div>

                {(!data.competencies || data.competencies.length === 0) ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-4">No competencies added yet</p>
                        <Button onClick={addCategory} variant="outline">
                            <Plus size={16} weight="bold" className="mr-2" />
                            Add your first category
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.competencies.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="border border-border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Label>Category Name</Label>
                                        <Input
                                            placeholder="e.g., Leadership & Management"
                                            value={category.category}
                                            onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeCategory(categoryIndex)}
                                        className="text-destructive hover:text-destructive mt-6"
                                    >
                                        <Trash size={16} weight="bold" />
                                    </Button>
                                </div>

                                {/* Skills List */}
                                <div className="space-y-2">
                                    <Label>Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {category.skills.map((skill, skillIndex) => (
                                            <span
                                                key={skillIndex}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-sm rounded-md"
                                            >
                                                {skill}
                                                <button
                                                    onClick={() => removeSkillFromCategory(categoryIndex, skillIndex)}
                                                    className="hover:text-destructive"
                                                >
                                                    <X size={12} weight="bold" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a skill..."
                                            value={selectedCategory === String(categoryIndex) ? newSkill : ""}
                                            onChange={(e) => {
                                                setSelectedCategory(String(categoryIndex));
                                                setNewSkill(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addSkillToCategory(categoryIndex, newSkill);
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => addSkillToCategory(categoryIndex, newSkill)}
                                            disabled={!newSkill.trim() || selectedCategory !== String(categoryIndex)}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                    <p className="font-medium">Example Categories:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Leadership & Management</li>
                        <li>Communication & Interpersonal</li>
                        <li>Technical Skills / Tools</li>
                        <li>Industry-Specific Expertise</li>
                    </ul>
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
                                        <Label>Job Title / Role</Label>
                                        <Input
                                            placeholder="Your position or title"
                                            value={exp.role}
                                            onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Organization</Label>
                                        <Input
                                            placeholder="Company, school, or organization"
                                            value={exp.company}
                                            onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Dates</Label>
                                    <Input
                                        placeholder="e.g., Jan 2020 — Present"
                                        value={exp.dates}
                                        onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Key Accomplishments</Label>
                                    <Textarea
                                        placeholder="Describe your achievements and impact. Start each point with an action verb (Led, Managed, Created, Improved, etc.)"
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

    // Education Section
    if (selectedSection === "education") {
        const addEducation = () => {
            const newEdu: ResumeEducation = {
                id: crypto.randomUUID(),
                degree: "",
                institution: "",
                year: "",
            };
            onUpdate({ education: [...(data.education || []), newEdu] });
        };

        const updateEducation = (id: string, field: keyof ResumeEducation, value: string) => {
            onUpdate({
                education: (data.education || []).map(edu =>
                    edu.id === id ? { ...edu, [field]: value } : edu
                )
            });
        };

        const removeEducation = (id: string) => {
            onUpdate({
                education: (data.education || []).filter(edu => edu.id !== id)
            });
        };

        return (
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Education & Professional Development</h2>
                        <p className="text-sm text-muted-foreground">
                            Add your educational background and certifications
                        </p>
                    </div>
                    <Button onClick={addEducation} size="sm">
                        <Plus size={16} weight="bold" className="mr-1" />
                        Add
                    </Button>
                </div>

                {(!data.education || data.education.length === 0) ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-4">No education added yet</p>
                        <Button onClick={addEducation} variant="outline">
                            <Plus size={16} weight="bold" className="mr-2" />
                            Add your education
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.education.map((edu, index) => (
                            <div key={edu.id} className="border border-border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium">Education {index + 1}</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeEducation(edu.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash size={16} weight="bold" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label>Degree / Certification / Course</Label>
                                    <Input
                                        placeholder="Degree name, certification, or training program"
                                        value={edu.degree}
                                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Institution / Provider</Label>
                                        <Input
                                            placeholder="University, college, or training provider"
                                            value={edu.institution}
                                            onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Year (Optional)</Label>
                                        <Input
                                            placeholder="Graduation or completion year"
                                            value={edu.year || ""}
                                            onChange={(e) => updateEducation(edu.id, "year", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                    <p className="font-medium">Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>List degrees in reverse chronological order</li>
                        <li>Include professional certifications and programs</li>
                        <li>You can omit graduation years if preferred</li>
                    </ul>
                </div>
            </div>
        );
    }

    return null;
}
