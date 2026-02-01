"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { ResumeData } from "@/types/resume";
import { LiveResumePreview } from "./LiveResumePreview";
import { EditingPanel } from "./EditingPanel";
import { AIWritingModal } from "./AIWritingModal";
import { Button } from "@/components/ui/button";
import { DownloadSimple, Trash, Sparkle, Upload, CloudCheck, CloudSlash, Cloud, CloudArrowUp } from "@phosphor-icons/react";
import { generateSummary, generateExperienceBullets } from "@/actions/generate-resume-content";
import { ProviderConfig } from "@/lib/llm/types";
import { exportToDocx } from "@/lib/export-docx";

type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

interface ResumeEditorProps {
    data: ResumeData;
    onUpdate: (data: Partial<ResumeData>) => void;
    onClear: () => void;
    onImport?: () => void;
    modelConfig?: Partial<ProviderConfig>;
    syncStatus?: SyncStatus;
    versionsToggle?: ReactNode;
}

export function ResumeEditor({ data, onUpdate, onClear, onImport, modelConfig, syncStatus = 'saved', versionsToggle }: ResumeEditorProps) {
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

    const [mobileTab, setMobileTab] = useState<'preview' | 'edit'>('edit');

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
            {/* Header - Sticky with high z-index */}
            <header className="backdrop-blur-xl bg-white dark:bg-neutral-950 border-b border-border shadow-sm sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-semibold truncate">
                            Resume Builder
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            {syncStatus === 'saving' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CloudArrowUp size={12} weight="bold" className="animate-pulse" />
                                    Saving...
                                </span>
                            )}
                            {syncStatus === 'saved' && (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CloudCheck size={12} weight="bold" />
                                    Saved
                                </span>
                            )}
                            {syncStatus === 'offline' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CloudSlash size={12} weight="bold" />
                                    Local only
                                </span>
                            )}
                            {syncStatus === 'error' && (
                                <span className="text-xs text-destructive flex items-center gap-1">
                                    <CloudSlash size={12} weight="bold" />
                                    Sync error
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Import Button - Expandable */}
                        {onImport && (
                            <button
                                onClick={onImport}
                                className="group hidden sm:inline-flex items-center h-9 px-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                            >
                                <Upload size={16} weight="bold" className="text-muted-foreground group-hover:text-primary shrink-0" />
                                <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                                    <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">Import</span>
                                </span>
                            </button>
                        )}

                        {/* Clear Button - Expandable */}
                        <button
                            onClick={onClear}
                            className="group hidden sm:inline-flex items-center h-9 px-2.5 rounded-md text-destructive hover:bg-destructive/10 transition-all duration-200"
                        >
                            <Trash size={16} weight="regular" className="shrink-0" />
                            <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">Clear</span>
                            </span>
                        </button>

                        {/* Versions Toggle */}
                        {versionsToggle}

                        {/* Tailor Button - Expandable */}
                        <Link href="/resume-tailor" className="hidden sm:inline-flex">
                            <button className="group inline-flex items-center h-9 px-2.5 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                                <Sparkle size={16} weight="fill" className="text-primary shrink-0" />
                                <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                                    <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">Tailor</span>
                                </span>
                            </button>
                        </Link>

                        {/* Export Button - Expandable */}
                        <button
                            onClick={handleDownloadWord}
                            className="group inline-flex items-center h-9 px-2.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-200"
                        >
                            <DownloadSimple size={16} weight="bold" className="shrink-0" />
                            <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">.docx</span>
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Tab Switcher */}
                <div className="lg:hidden border-t border-border px-4 py-2 bg-secondary/20">
                    <div className="grid grid-cols-2 gap-2 bg-secondary/50 p-1 rounded-lg">
                        <button
                            onClick={() => setMobileTab('edit')}
                            className={`text-sm font-medium py-1.5 rounded-md transition-all ${mobileTab === 'edit'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setMobileTab('preview')}
                            className={`text-sm font-medium py-1.5 rounded-md transition-all ${mobileTab === 'preview'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Preview
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                <div className="max-w-[1600px] mx-auto h-full flex lg:gap-0">
                    {/* Left: Live Preview (Hidden on mobile unless active) */}
                    <div className={`
                        lg:w-[42%] lg:block lg:border-r border-border bg-muted/30 overflow-y-auto p-4 lg:p-8
                        absolute inset-0 lg:static z-20 lg:z-auto bg-background lg:bg-muted/30
                        ${mobileTab === 'preview' ? 'block' : 'hidden'}
                    `}>
                        {/* Mobile Zoom Wrapper */}
                        <div className="min-w-[8.5in] lg:min-w-0 transform origin-top-left scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 h-full">
                            <LiveResumePreview
                                data={data}
                                onEdit={(section) => {
                                    setSelectedSection(section);
                                    setMobileTab('edit'); // Switch to edit on click
                                }}
                                selectedSection={selectedSection}
                            />
                        </div>
                    </div>

                    {/* Right: Editing Panel (Hidden on mobile unless active) */}
                    <div className={`
                        flex-1 overflow-hidden bg-background
                        absolute inset-0 lg:static z-20 lg:z-auto
                        ${mobileTab === 'edit' ? 'block' : 'hidden'}
                    `}>
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
