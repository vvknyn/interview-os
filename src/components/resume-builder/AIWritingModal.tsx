"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkle, Briefcase } from "@phosphor-icons/react";

interface ExperienceContext {
    role: string;
    company: string;
    dates: string;
    existingDescription: string;
}

interface SummaryContext {
    profession: string;
    yearsOfExperience: number;
    skills: string[];
}

interface AIWritingModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: string;
    onGenerate: (params: any) => Promise<void>;
    experienceContext?: ExperienceContext;
    summaryContext?: SummaryContext;
}

export function AIWritingModal({ isOpen, onClose, section, onGenerate, experienceContext, summaryContext }: AIWritingModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Pre-populate form data when modal opens or context changes
    useEffect(() => {
        if (isOpen) {
            if (section.startsWith("experience-") && experienceContext) {
                setFormData({
                    description: experienceContext.existingDescription || ""
                });
            } else if (section === "summary" && summaryContext) {
                setFormData({
                    role: summaryContext.profession || "",
                    yearsExperience: summaryContext.yearsOfExperience || 0,
                    skillsText: summaryContext.skills?.join(", ") || ""
                });
            } else {
                setFormData({});
            }
        }
    }, [isOpen, section, experienceContext, summaryContext]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await onGenerate(formData);
            onClose();
        } catch (error) {
            console.error("Generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const renderForm = () => {
        if (section === "summary") {
            return (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">Target Role</Label>
                        <Input
                            id="role"
                            placeholder="e.g., Senior Product Manager"
                            value={formData.role || ""}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="years">Years of Experience</Label>
                        <Input
                            id="years"
                            type="number"
                            placeholder="e.g., 5"
                            value={formData.yearsExperience || ""}
                            onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="skills">Key Skills (comma separated)</Label>
                        <Input
                            id="skills"
                            placeholder="e.g., Leadership, Strategy, Analytics"
                            value={formData.skillsText || ""}
                            onChange={(e) => setFormData({ ...formData, skillsText: e.target.value })}
                        />
                    </div>
                </div>
            );
        }

        if (section.startsWith("experience-")) {
            return (
                <div className="space-y-4">
                    {/* Show context from the experience entry */}
                    {experienceContext && (experienceContext.role || experienceContext.company) && (
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                <Briefcase size={16} weight="duotone" className="text-brand" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {experienceContext.role || "Role not specified"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {experienceContext.company || "Company not specified"}
                                    {experienceContext.dates && ` • ${experienceContext.dates}`}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            {formData.description ? "Edit or add more details" : "Describe what you did in this role"}
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="I managed a team of 5 engineers and led the development of..."
                            className="min-h-[120px] text-sm"
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            {formData.description
                                ? "The AI will enhance your existing content into professional bullet points."
                                : "Don't worry about formatting - just describe your responsibilities and achievements naturally."}
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-neutral-950">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkle size={20} weight="fill" className="text-purple-600" />
                        Generate with AI
                    </DialogTitle>
                    <DialogDescription>
                        {section === "summary"
                            ? "Tell us about yourself and we'll write a professional summary"
                            : "Describe your role and we'll create professional bullet points"}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {renderForm()}
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkle size={16} weight="fill" className="mr-2" />
                                Generate
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
