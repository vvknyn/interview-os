"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, CaretDown, WarningCircle, Gear, ChartBar, Info, ArrowClockwise, CircleNotch } from "@phosphor-icons/react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UsageIndicator } from "./UsageIndicator";
import { checkProviderUsage } from "@/actions/check-usage";
import type { RateLimitData } from "@/lib/llm/usage-tracker";

function formatCompact(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

// One recommended model per provider - simplified UX
export const AVAILABLE_MODELS = {
    groq: [
        { id: "llama-3.3-70b-versatile", name: "Groq", description: "Fast and reliable", category: "Free" as const }
    ],
    gemini: [
        { id: "gemini-flash-latest", name: "Gemini", description: "Google's latest model", category: "Free" as const }
    ],
    openai: [
        { id: "gpt-4o-mini", name: "OpenAI", description: "Cost-effective and fast", category: "Paid" as const }
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
    const [rateLimits, setRateLimits] = useState<Record<string, RateLimitData>>({});
    const [loadingUsage, setLoadingUsage] = useState<Record<string, boolean>>({});
    const fetchedRef = useRef(false);

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

    const fetchRateLimits = useCallback(async (force = false) => {
        if (!apiKeys) return;
        const providers = (['groq', 'gemini', 'openai'] as const).filter(p => apiKeys[p]);
        if (providers.length === 0) return;

        setLoadingUsage(prev => {
            const next = { ...prev };
            providers.forEach(p => next[p] = true);
            return next;
        });

        const results = await Promise.allSettled(
            providers.map(async (prov) => {
                const result = await checkProviderUsage(prov, apiKeys[prov]!);
                return { prov, result };
            })
        );

        const newLimits: Record<string, RateLimitData> = {};
        for (const r of results) {
            if (r.status === 'fulfilled' && r.value.result.rateLimits) {
                newLimits[r.value.prov] = r.value.result.rateLimits;
            }
        }

        setRateLimits(prev => ({ ...prev, ...newLimits }));
        setLoadingUsage({});
    }, [apiKeys]);

    // Auto-fetch rate limits when Usage tab is first opened
    useEffect(() => {
        if (showUsage && !fetchedRef.current) {
            fetchedRef.current = true;
            fetchRateLimits();
        }
    }, [showUsage, fetchRateLimits]);

    // Reset fetchedRef when popover closes
    useEffect(() => {
        if (!open) {
            fetchedRef.current = false;
        }
    }, [open]);

    const isAnyLoading = Object.values(loadingUsage).some(Boolean);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-10 px-4 justify-between text-sm font-semibold border-transparent hover:bg-brand/5 hover:text-brand transition-colors shadow-sm",
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
            <PopoverContent className="w-[360px] p-0" align="end">
                {/* Tab switcher */}
                <div className="flex shadow-[var(--shadow-sm)]">
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
                    /* Rate limits by model */
                    <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium">Rate limits by model</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info size={12} className="text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-[200px]">
                                            <p className="text-xs">Current usage vs. limit for each configured provider</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <button
                                onClick={() => fetchRateLimits(true)}
                                disabled={isAnyLoading}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Refresh rate limits"
                            >
                                {isAnyLoading
                                    ? <CircleNotch size={12} className="animate-spin text-muted-foreground" />
                                    : <ArrowClockwise size={12} className="text-muted-foreground" />
                                }
                            </button>
                        </div>

                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-muted-foreground">
                                    <th className="text-left py-1.5 font-medium">Model</th>
                                    <th className="text-left py-1.5 font-medium">Category</th>
                                    <th className="text-right py-1.5 font-medium">RPM</th>
                                    <th className="text-right py-1.5 font-medium">TPM</th>
                                    <th className="text-right py-1.5 font-medium">RPD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(Object.entries(AVAILABLE_MODELS) as [Provider, typeof AVAILABLE_MODELS[Provider]][]).map(([prov, models]) => {
                                    const modelInfo = models[0];
                                    const hasKey = !!apiKeys?.[prov];
                                    if (!hasKey) return null;
                                    const isActive = prov === provider;
                                    const rl = rateLimits[prov];
                                    const isLoading = loadingUsage[prov];
                                    return (
                                        <tr
                                            key={prov}
                                            className={cn(
                                                "transition-colors",
                                                isActive ? "bg-brand/5 font-medium" : "text-muted-foreground"
                                            )}
                                        >
                                            <td className="py-1.5">{modelInfo.name}</td>
                                            <td className="py-1.5">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px]",
                                                    modelInfo.category === "Free"
                                                        ? "bg-green-500/10 text-green-600"
                                                        : "bg-blue-500/10 text-blue-600"
                                                )}>
                                                    {modelInfo.category}
                                                </span>
                                            </td>
                                            <td className="text-right py-1.5">
                                                {isLoading ? '...' : rl && rl.rpm.limit > 0
                                                    ? `${rl.rpm.used} / ${rl.rpm.limit}`
                                                    : '\u2014'}
                                            </td>
                                            <td className="text-right py-1.5">
                                                {isLoading ? '...' : rl && rl.tpm.limit > 0
                                                    ? `${formatCompact(rl.tpm.used)} / ${formatCompact(rl.tpm.limit)}`
                                                    : '\u2014'}
                                            </td>
                                            <td className="text-right py-1.5">
                                                {isLoading ? '...' : rl && rl.rpd.limit > 0
                                                    ? `${rl.rpd.used} / ${formatCompact(rl.rpd.limit)}`
                                                    : '\u2014'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {!apiKeys?.groq && !apiKeys?.gemini && !apiKeys?.openai && (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                                <p>No API keys configured</p>
                                <p className="text-xs mt-1">Add an API key to see rate limits</p>
                            </div>
                        )}
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
                        ? "border-brand bg-brand"
                        : "border-muted-foreground/30"
                )}>
                    {isActive && (
                        <Check size={10} weight="bold" className="text-brand-foreground" />
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
