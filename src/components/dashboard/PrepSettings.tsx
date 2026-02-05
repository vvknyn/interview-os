"use client";

import { useState, useEffect } from "react";
import { Sliders, Lightning, Target, Rocket, CaretDown, CaretUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
}

const STORAGE_KEY = "interview-os-prep-settings";

export function PrepSettings({ settings, onChange, className }: PrepSettingsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activePreset, setActivePreset] = useState<PresetKey | "custom">("standard");

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

    return (
        <div className={cn("relative", className)}>
            {/* Collapsed View - Compact Badge */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isExpanded ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                )}
            >
                <Sliders size={14} />
                <span className="hidden sm:inline">Prep:</span>
                <span className="font-semibold">
                    {activePreset === "custom" ? "Custom" : PRESETS[activePreset].label}
                </span>
                <span className="text-muted-foreground">({totalQuestions} Qs)</span>
                {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Presets */}
                    <div className="p-3 border-b border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preparation Intensity</p>
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
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-transparent hover:border-border hover:bg-muted/50"
                                        )}
                                    >
                                        <Icon size={18} weight={isActive ? "fill" : "regular"} />
                                        <span className="text-xs font-medium mt-1">{preset.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            {activePreset !== "custom" ? PRESETS[activePreset].description : "Custom settings"}
                        </p>
                    </div>

                    {/* Custom Controls */}
                    <div className="p-3 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Fine-tune Question Counts</p>

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

                    {/* Footer */}
                    <div className="px-3 py-2 bg-muted/30 border-t border-border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                            Total: <strong>{totalQuestions}</strong> questions
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setIsExpanded(false)}
                        >
                            Done
                        </Button>
                    </div>
                </div>
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
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{hint}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
                <button
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    -
                </button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
                <button
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
