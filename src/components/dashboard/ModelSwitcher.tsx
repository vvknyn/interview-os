"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, CaretDown, CheckCircle, WarningCircle, Gear } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// One recommended model per provider - simplified UX
export const AVAILABLE_MODELS = {
    groq: [
        { id: "llama-3.3-70b-versatile", name: "Groq", description: "Fast and reliable" }
    ],
    gemini: [
        { id: "gemini-flash-latest", name: "Gemini", description: "Google's latest model" }
    ],
    openai: [
        { id: "gpt-4o-mini", name: "OpenAI", description: "Cost-effective and fast" }
    ],
} as const;

type Provider = keyof typeof AVAILABLE_MODELS;

interface ModelSwitcherProps {
    provider: Provider;
    model: string;
    onModelChange: (provider: Provider, model: string) => void;
    apiKeys?: { groq?: string; gemini?: string; openai?: string };
    onConfigureKey?: (provider: Provider) => void;
    className?: string;
}

export function ModelSwitcher({ provider, model, onModelChange, apiKeys, onConfigureKey, className }: ModelSwitcherProps) {
    const [open, setOpen] = useState(false);

    // Just show provider name
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const displayText = providerLabel;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-10 px-4 justify-between text-sm font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors shadow-sm",
                        className
                    )}
                >
                    <span className="truncate max-w-[160px]">{displayText}</span>
                    <CaretDown size={14} className="ml-2 opacity-50 flex-shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-2" align="end">
                <div className="space-y-1">
                    {/* Groq */}
                    <button
                        onClick={() => {
                            onModelChange("groq", AVAILABLE_MODELS.groq[0].id);
                            setOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md hover:bg-muted/50 transition-colors",
                            provider === "groq" && "bg-muted"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                provider === "groq"
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30"
                            )}>
                                {provider === "groq" && (
                                    <Check size={10} weight="bold" className="text-primary-foreground" />
                                )}
                            </div>
                            <span className="font-medium">Groq</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {apiKeys?.groq ? (
                                <CheckCircle size={14} weight="fill" className="text-green-500" />
                            ) : (
                                <WarningCircle size={14} weight="fill" className="text-yellow-500" />
                            )}
                            {onConfigureKey && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onConfigureKey('groq');
                                        setOpen(false);
                                    }}
                                    className="p-1 rounded hover:bg-muted transition-colors"
                                    title="Configure API key"
                                >
                                    <Gear size={14} className="text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </button>

                    {/* Gemini */}
                    <button
                        onClick={() => {
                            onModelChange("gemini", AVAILABLE_MODELS.gemini[0].id);
                            setOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md hover:bg-muted/50 transition-colors",
                            provider === "gemini" && "bg-muted"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                provider === "gemini"
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30"
                            )}>
                                {provider === "gemini" && (
                                    <Check size={10} weight="bold" className="text-primary-foreground" />
                                )}
                            </div>
                            <span className="font-medium">Gemini</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {apiKeys?.gemini ? (
                                <CheckCircle size={14} weight="fill" className="text-green-500" />
                            ) : (
                                <WarningCircle size={14} weight="fill" className="text-yellow-500" />
                            )}
                            {onConfigureKey && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onConfigureKey('gemini');
                                        setOpen(false);
                                    }}
                                    className="p-1 rounded hover:bg-muted transition-colors"
                                    title="Configure API key"
                                >
                                    <Gear size={14} className="text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </button>

                    {/* OpenAI */}
                    <button
                        onClick={() => {
                            onModelChange("openai", AVAILABLE_MODELS.openai[0].id);
                            setOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md hover:bg-muted/50 transition-colors",
                            provider === "openai" && "bg-muted"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                provider === "openai"
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30"
                            )}>
                                {provider === "openai" && (
                                    <Check size={10} weight="bold" className="text-primary-foreground" />
                                )}
                            </div>
                            <span className="font-medium">OpenAI</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {apiKeys?.openai ? (
                                <CheckCircle size={14} weight="fill" className="text-green-500" />
                            ) : (
                                <WarningCircle size={14} weight="fill" className="text-yellow-500" />
                            )}
                            {onConfigureKey && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onConfigureKey('openai');
                                        setOpen(false);
                                    }}
                                    className="p-1 rounded hover:bg-muted transition-colors"
                                    title="Configure API key"
                                >
                                    <Gear size={14} className="text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
