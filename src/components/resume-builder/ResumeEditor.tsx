"use client";

import { useState } from "react";
import Link from "next/link";
import { ResumeData } from "@/types/resume";
import { LiveResumePreview } from "./LiveResumePreview";
import { EditingPanel } from "./EditingPanel";
import { AIWritingModal } from "./AIWritingModal";
import { Button } from "@/components/ui/button";
import { DownloadSimple, Trash, Sparkle } from "@phosphor-icons/react";
import { generateSummary, generateExperienceBullets } from "@/actions/generate-resume-content";
import { ProviderConfig } from "@/lib/llm/types";
import { exportToDocx } from "@/lib/export-docx";

interface ResumeEditorProps {
    data: ResumeData;
    onUpdate: (data: Partial<ResumeData>) => void;
    onClear: () => void;
    modelConfig?: Partial<ProviderConfig>;
}

export function ResumeEditor({ data, onUpdate, onClear, modelConfig }: ResumeEditorProps) {
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [currentAISection, setCurrentAISection] = useState<string | null>(null);
    const handleDownloadWord = () => {
        try {
            exportToDocx(data);
        } catch (error) {
            console.error("Word export error:", error);
            alert("Failed to export to Word. Please try again.");
        }
    };

    const handleGenerateWithAI = async (section: string) => {
        setCurrentAISection(section);
        setAiModalOpen(true);
    };

    const handleAIGenerate = async (params: any) => {
        if (!currentAISection) return;

        try {
            if (currentAISection === "summary") {
                const skills = params.skillsText ? params.skillsText.split(',').map((s: string) => s.trim()) : [];
                const result = await generateSummary({
                    role: params.role || "",
                    yearsExperience: params.yearsExperience || 0,
                    keySkills: skills,
                    configOverride: modelConfig
                });

                if (result.error) {
                    alert(`Error: ${result.error}`);
                    return;
                }

                if (result.summary) {
                    onUpdate({ generatedSummary: result.summary });
                }
            } else if (currentAISection.startsWith("experience-")) {
                const expId = currentAISection.replace("experience-", "");
                const exp = data.experience?.find(e => e.id === expId);

                if (!exp) return;

                const result = await generateExperienceBullets({
                    role: exp.role || "",
                    company: exp.company || "",
                    description: params.description || "",
                    configOverride: modelConfig
                });

                if (result.error) {
                    alert(`Error: ${result.error}`);
                    return;
                }

                if (result.bullets && result.bullets.length > 0) {
                    const bulletText = result.bullets.map(b => `• ${b}`).join('\n');
                    onUpdate({
                        experience: data.experience?.map(e =>
                            e.id === expId ? { ...e, description: bulletText } : e
                        )
                    });
                }
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert("Failed to generate content. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header with Glassmorphic Design */}
            <header className="backdrop-blur-xl bg-background/95 border-b border-border shadow-sm sticky top-0 z-10">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Resume Builder
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {isSaving ? 'Saving...' : 'Auto-saved'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash size={16} weight="regular" className="mr-2" />
                            Clear
                        </Button>
                        <Link href="/resume-tailor">
                            <Button
                                variant="outline"
                                size="sm"
                            >
                                <Sparkle size={16} weight="fill" className="mr-2" />
                                Tailor for Job
                            </Button>
                        </Link>
                        <div className="relative">
                            <Button
                                onClick={handleDownloadWord}
                                className="bg-foreground text-background hover:bg-foreground/90"
                            >
                                <DownloadSimple size={16} weight="bold" className="mr-2" />
                                Download Word
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-[1600px] mx-auto h-full flex gap-0">
                    {/* Left: Live Preview */}
                    <div className="w-[42%] border-r border-border bg-muted/30 overflow-y-auto p-8">
                        <LiveResumePreview
                            data={data}
                            onEdit={setSelectedSection}
                            selectedSection={selectedSection}
                        />
                    </div>

                    {/* Right: Editing Panel */}
                    <div className="flex-1 overflow-hidden bg-background">
                        <EditingPanel
                            selectedSection={selectedSection}
                            data={data}
                            onUpdate={onUpdate}
                            onGenerateWithAI={handleGenerateWithAI}
                        />
                    </div>
                </div>
            </div>

            {/* AI Modal */}
            <AIWritingModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                section={currentAISection || ""}
                onGenerate={handleAIGenerate}
            />
        </div>
    );
}
