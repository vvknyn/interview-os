"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, CaretDown, CheckCircle, WarningCircle, Gear, ChartBar } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { UsageIndicator } from "./UsageIndicator";

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
    const [showUsage, setShowUsage] = useState(false);
    const [providerStatus, setProviderStatus] = useState<Record<Provider, 'ok' | 'warning' | 'error' | 'unknown'>>({
        groq: 'unknown',
        gemini: 'unknown',
        openai: 'unknown'
    });

    // Just show provider name
    const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
    const displayText = providerLabel;

    // Get status indicator for button
    const currentStatus = providerStatus[provider];
    const statusColor = currentStatus === 'ok' ? 'bg-green-500' :
        currentStatus === 'warning' ? 'bg-yellow-500' :
            currentStatus === 'error' ? 'bg-red-500' : 'bg-muted-foreground';

    const handleStatusChange = useCallback((prov: Provider) => (status: 'ok' | 'warning' | 'error' | 'unknown') => {
        setProviderStatus(prev => ({ ...prev, [prov]: status }));
    }, []);

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
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", statusColor)} />
                        <span className="truncate max-w-[140px]">{displayText}</span>
                    </div>
                    <CaretDown size={14} className="ml-2 opacity-50 flex-shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
                {/* Tab switcher */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setShowUsage(false)}
                        className={cn(
                            "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                            !showUsage ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Providers
                    </button>
                    <button
                        onClick={() => setShowUsage(true)}
                        className={cn(
                            "flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                            showUsage ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ChartBar size={14} />
                        Usage
                    </button>
                </div>

                {!showUsage ? (
                    /* Provider selection */
                    <div className="p-2 space-y-1">
                        {/* Groq */}
                        <ProviderRow
                            name="Groq"
                            provider="groq"
                            isActive={provider === "groq"}
                            hasKey={!!apiKeys?.groq}
                            apiKey={apiKeys?.groq}
                            onSelect={() => {
                                onModelChange("groq", AVAILABLE_MODELS.groq[0].id);
                                setOpen(false);
                            }}
                            onConfigure={() => {
                                onConfigureKey?.('groq');
                                setOpen(false);
                            }}
                            onStatusChange={handleStatusChange('groq')}
                        />

                        {/* Gemini */}
                        <ProviderRow
                            name="Gemini"
                            provider="gemini"
                            isActive={provider === "gemini"}
                            hasKey={!!apiKeys?.gemini}
                            apiKey={apiKeys?.gemini}
                            onSelect={() => {
                                onModelChange("gemini", AVAILABLE_MODELS.gemini[0].id);
                                setOpen(false);
                            }}
                            onConfigure={() => {
                                onConfigureKey?.('gemini');
                                setOpen(false);
                            }}
                            onStatusChange={handleStatusChange('gemini')}
                        />

                        {/* OpenAI */}
                        <ProviderRow
                            name="OpenAI"
                            provider="openai"
                            isActive={provider === "openai"}
                            hasKey={!!apiKeys?.openai}
                            apiKey={apiKeys?.openai}
                            onSelect={() => {
                                onModelChange("openai", AVAILABLE_MODELS.openai[0].id);
                                setOpen(false);
                            }}
                            onConfigure={() => {
                                onConfigureKey?.('openai');
                                setOpen(false);
                            }}
                            onStatusChange={handleStatusChange('openai')}
                        />
                    </div>
                ) : (
                    /* Usage dashboard */
                    <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                        <p className="text-xs text-muted-foreground">
                            Click refresh to check current API status and limits.
                        </p>

                        {/* Show usage for configured providers */}
                        {apiKeys?.groq && (
                            <div className="p-3 rounded-lg border bg-card">
                                <UsageIndicator
                                    provider="groq"
                                    apiKey={apiKeys.groq}
                                    onStatusChange={handleStatusChange('groq')}
                                />
                            </div>
                        )}

                        {apiKeys?.gemini && (
                            <div className="p-3 rounded-lg border bg-card">
                                <UsageIndicator
                                    provider="gemini"
                                    apiKey={apiKeys.gemini}
                                    onStatusChange={handleStatusChange('gemini')}
                                />
                            </div>
                        )}

                        {apiKeys?.openai && (
                            <div className="p-3 rounded-lg border bg-card">
                                <UsageIndicator
                                    provider="openai"
                                    apiKey={apiKeys.openai}
                                    onStatusChange={handleStatusChange('openai')}
                                />
                            </div>
                        )}

                        {!apiKeys?.groq && !apiKeys?.gemini && !apiKeys?.openai && (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                                <p>No API keys configured</p>
                                <p className="text-xs mt-1">Add an API key to see usage stats</p>
                            </div>
                        )}

                        {/* Helpful info */}
                        <div className="text-[10px] text-muted-foreground pt-2 border-t">
                            <p><strong>Groq:</strong> 100K tokens/day (free tier)</p>
                            <p><strong>Gemini:</strong> 5 req/min, 1M tokens/day (free tier)</p>
                            <p><strong>OpenAI:</strong> Pay per use</p>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// Helper component for provider rows
interface ProviderRowProps {
    name: string;
    provider: Provider;
    isActive: boolean;
    hasKey: boolean;
    apiKey?: string;
    onSelect: () => void;
    onConfigure: () => void;
    onStatusChange?: (status: 'ok' | 'warning' | 'error' | 'unknown') => void;
}

function ProviderRow({ name, provider, isActive, hasKey, apiKey, onSelect, onConfigure, onStatusChange }: ProviderRowProps) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md hover:bg-muted/50 transition-colors",
                isActive && "bg-muted"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    isActive
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                )}>
                    {isActive && (
                        <Check size={10} weight="bold" className="text-primary-foreground" />
                    )}
                </div>
                <span className="font-medium">{name}</span>
            </div>
            <div className="flex items-center gap-1.5">
                {/* Usage indicator (compact) */}
                {hasKey && apiKey && (
                    <UsageIndicator
                        provider={provider}
                        apiKey={apiKey}
                        compact
                        onStatusChange={onStatusChange}
                    />
                )}
                {!hasKey && (
                    <WarningCircle size={14} weight="fill" className="text-yellow-500" />
                )}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                        e.stopPropagation();
                        onConfigure();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onConfigure();
                        }
                    }}
                    className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                    title="Configure API key"
                    aria-label="Configure API key"
                >
                    <Gear size={14} className="text-muted-foreground" />
                </div>
            </div>
        </button>
    );
}
