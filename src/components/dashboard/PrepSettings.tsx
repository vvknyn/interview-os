import { useState, useEffect } from "react";
import { Sliders, Lightning, Target, Rocket, Link as LinkIcon, FileText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Preset configurations for different preparation intensities
const PRESETS = {
    quick: {
        label: "Quick",
        description: "Fast prep for short notice interviews",
        icon: Lightning,
        settings: {
            questions: 10,
            reverse: 3,
            technical: 3,
            systemDesign: 5
        }
    },
    standard: {
        label: "Standard",
        description: "Balanced preparation (Recommended)",
        icon: Target,
        settings: {
            questions: 20,
            reverse: 5,
            technical: 5,
            systemDesign: 10
        }
    },
    thorough: {
        label: "Thorough",
        description: "Comprehensive deep-dive preparation",
        icon: Rocket,
        settings: {
            questions: 30,
            reverse: 10,
            technical: 10,
            systemDesign: 15
        }
    }
} as const;

type PresetKey = keyof typeof PRESETS;

export interface QuestionSettings {
    questions: number;      // Interview questions (behavioral, knowledge, etc.)
    reverse: number;        // Questions to ask the interviewer
    technical: number;      // Technical concept questions
    systemDesign: number;   // System design / PM questions
}

interface PrepSettingsProps {
    settings: QuestionSettings;
    onChange: (settings: QuestionSettings) => void;
    className?: string;
    // Job Context Props
    jobUrl: string;
    onJobUrlChange: (url: string) => void;
    jobContext: string;
    onJobContextChange: (context: string) => void;
    isFetchingJob: boolean;
    onFetchJobContext: () => void;
}

const STORAGE_KEY = "interview-os-prep-settings";

export function PrepSettings({
    settings,
    onChange,
    className,
    jobUrl,
    onJobUrlChange,
    jobContext,
    onJobContextChange,
    isFetchingJob,
    onFetchJobContext
}: PrepSettingsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activePreset, setActivePreset] = useState<PresetKey | "custom">("standard");
    const [jobInputMode, setJobInputMode] = useState<"url" | "text">("url");

    // Detect which preset matches current settings
    useEffect(() => {
        for (const [key, preset] of Object.entries(PRESETS)) {
            if (
                settings.questions === preset.settings.questions &&
                settings.reverse === preset.settings.reverse &&
                settings.technical === preset.settings.technical &&
                settings.systemDesign === preset.settings.systemDesign
            ) {
                setActivePreset(key as PresetKey);
                return;
            }
        }
        setActivePreset("custom");
    }, [settings]);

    // Save to localStorage when settings change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const handlePresetChange = (preset: PresetKey) => {
        setActivePreset(preset);
        onChange(PRESETS[preset].settings);
    };

    const handleCustomChange = (key: keyof QuestionSettings, value: number) => {
        const newSettings = { ...settings, [key]: value };
        onChange(newSettings);
    };

    const totalQuestions = settings.questions + settings.reverse + settings.technical + settings.systemDesign;

    // Determine if job context is active
    const hasJobContext = jobContext.length > 0 || jobUrl.length > 0;

    return (
        <div className={cn("relative", className)}>
            {/* Collapsed View - Compact Icon Trigger */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md transition-all relative",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    isExpanded && "bg-muted text-foreground",
                    hasJobContext && !isExpanded && "text-brand bg-brand/10 hover:bg-brand/20"
                )}
                title="Configure preparation settings & context"
            >
                <Sliders size={18} weight={hasJobContext ? "fill" : "regular"} />
                {activePreset !== "standard" && !hasJobContext && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <>
                    {/* Backdrop to close on click outside */}
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setIsExpanded(false)}
                    />

                    <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-border rounded-lg shadow-2xl z-[110] overflow-visible animate-in slide-in-from-top-1 fade-in duration-200 flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-3 border-b border-border bg-muted/10 rounded-t-lg">
                            <h3 className="text-sm font-semibold">Interview Configuration</h3>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {/* Job Context Section */}
                            <div className="p-4 border-b border-border space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <LinkIcon size={14} className="text-brand" />
                                        Job Context
                                    </div>
                                    <button
                                        onClick={() => setJobInputMode(mode => mode === 'url' ? 'text' : 'url')}
                                        className="text-[10px] text-muted-foreground hover:text-brand transition-colors underline decoration-dotted underline-offset-2"
                                    >
                                        {jobInputMode === 'url' ? 'Paste text instead' : 'Paste URL instead'}
                                    </button>
                                </div>

                                <div className="relative">
                                    {jobInputMode === 'url' ? (
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    type="url"
                                                    placeholder="Paste job posting URL..."
                                                    className="h-9 text-xs pr-8"
                                                    value={jobUrl}
                                                    onChange={(e) => {
                                                        onJobUrlChange(e.target.value);
                                                        if (!e.target.value) onJobContextChange("");
                                                    }}
                                                    onBlur={() => {
                                                        if (jobUrl && !jobContext) onFetchJobContext();
                                                    }}
                                                />
                                                {isFetchingJob && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                        <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <Textarea
                                            placeholder="Paste the full job description here..."
                                            className="min-h-[80px] text-xs resize-y"
                                            value={jobContext}
                                            onChange={(e) => {
                                                onJobContextChange(e.target.value);
                                                onJobUrlChange(""); // Clear URL if pasting text
                                            }}
                                        />
                                    )}

                                    {jobContext && !isFetchingJob && (
                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded border border-green-100">
                                            <FileText size={12} />
                                            Context Active ({jobContext.length} chars)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Presets */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-foreground">Preparation Intensity</p>
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {totalQuestions} questions
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.entries(PRESETS) as [PresetKey, typeof PRESETS[PresetKey]][]).map(([key, preset]) => {
                                        const Icon = preset.icon;
                                        const isActive = activePreset === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => handlePresetChange(key)}
                                                className={cn(
                                                    "flex flex-col items-center p-2 rounded-md border transition-all text-center",
                                                    isActive
                                                        ? "border-brand bg-brand/5 text-brand shadow-sm"
                                                        : "border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground"
                                                )}
                                            >
                                                <Icon size={20} weight={isActive ? "fill" : "regular"} className="mb-1.5" />
                                                <span className="text-[11px] font-medium">{preset.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
                                    {activePreset !== "custom" ? PRESETS[activePreset].description : "Custom configuration"}
                                </p>
                            </div>

                            {/* Custom Controls */}
                            <div className="p-4 space-y-4">
                                <p className="text-xs font-semibold text-foreground">Custom Question Counts</p>

                                <SettingRow
                                    label="Interview Questions"
                                    hint="Behavioral, knowledge, coding"
                                    value={settings.questions}
                                    min={5}
                                    max={30}
                                    onChange={(v) => handleCustomChange("questions", v)}
                                />

                                <SettingRow
                                    label="Questions to Ask"
                                    hint="Reverse interview questions"
                                    value={settings.reverse}
                                    min={3}
                                    max={15}
                                    onChange={(v) => handleCustomChange("reverse", v)}
                                />

                                <SettingRow
                                    label="Technical Concepts"
                                    hint="Deep-dive technical topics"
                                    value={settings.technical}
                                    min={3}
                                    max={15}
                                    onChange={(v) => handleCustomChange("technical", v)}
                                />

                                <SettingRow
                                    label="System Design / PM"
                                    hint="Architecture & product questions"
                                    value={settings.systemDesign}
                                    min={3}
                                    max={20}
                                    onChange={(v) => handleCustomChange("systemDesign", v)}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-muted/10 border-t border-border flex justify-end items-center rounded-b-lg">
                            <Button
                                variant="default"
                                size="sm"
                                className="text-xs h-7 px-4"
                                onClick={() => setIsExpanded(false)}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Individual setting row with increment/decrement buttons
interface SettingRowProps {
    label: string;
    hint: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

function SettingRow({ label, hint, value, min, max, onChange }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex-1 min-w-0 mr-4">
                <p className="text-xs font-medium truncate text-foreground/80">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{hint}</p>
            </div>
            <div className="flex items-center gap-1 bg-muted/20 rounded p-0.5 border border-border/50 group-hover:border-border transition-colors">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all text-muted-foreground hover:text-foreground"
                >
                    -
                </button>
                <span className="w-8 text-center text-xs font-medium tabular-nums">{value}</span>
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all text-muted-foreground hover:text-foreground"
                >
                    +
                </button>
            </div>
        </div>
    );
}

// Helper to load saved settings from localStorage
export function loadPrepSettings(): QuestionSettings {
    if (typeof window === "undefined") {
        return PRESETS.standard.settings;
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Validate the structure
            if (
                typeof parsed.questions === "number" &&
                typeof parsed.reverse === "number" &&
                typeof parsed.technical === "number" &&
                typeof parsed.systemDesign === "number"
            ) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Failed to load prep settings from localStorage", e);
    }

    return PRESETS.standard.settings;
}
