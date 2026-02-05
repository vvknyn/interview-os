"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CircleNotch, CheckCircle, Warning, XCircle, ArrowClockwise, Info } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { checkProviderUsage, CheckUsageResult } from "@/actions/check-usage";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Global cache for usage results (persists across component instances)
const usageCache = new Map<string, { result: CheckUsageResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

interface UsageIndicatorProps {
    provider: 'groq' | 'gemini' | 'openai';
    apiKey?: string;
    compact?: boolean;
    autoCheck?: boolean; // New prop: whether to auto-check on mount (default: false for compact, true for full)
    onStatusChange?: (status: 'ok' | 'warning' | 'error' | 'unknown') => void;
}

export function UsageIndicator({ provider, apiKey, compact = false, autoCheck, onStatusChange }: UsageIndicatorProps) {
    const [usage, setUsage] = useState<CheckUsageResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const mountedRef = useRef(true);

    // Default autoCheck: false for compact (lazy), true for full view
    const shouldAutoCheck = autoCheck ?? !compact;

    // Use a ref to avoid re-creating checkUsage when onStatusChange changes
    const onStatusChangeRef = useRef(onStatusChange);
    onStatusChangeRef.current = onStatusChange;

    const checkUsage = useCallback(async (forceRefresh = false) => {
        if (!apiKey) {
            setUsage({
                provider,
                status: 'error',
                message: 'No API key'
            });
            return;
        }

        // Check cache first (unless forcing refresh)
        const cacheKey = `${provider}:${apiKey.slice(-8)}`;
        if (!forceRefresh) {
            const cached = usageCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                setUsage(cached.result);
                setLastChecked(new Date(cached.timestamp));
                // Don't call onStatusChange for cache hits to prevent loops
                return;
            }
        }

        setIsLoading(true);
        try {
            const result = await checkProviderUsage(provider, apiKey);
            if (!mountedRef.current) return;

            setUsage(result);
            setLastChecked(new Date());

            // Update cache
            usageCache.set(cacheKey, { result, timestamp: Date.now() });

            // Call status change callback via ref (prevents dependency issues)
            onStatusChangeRef.current?.(result.status);
        } catch (e) {
            if (!mountedRef.current) return;
            setUsage({
                provider,
                status: 'unknown',
                message: 'Check failed'
            });
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [provider, apiKey]); // Removed onStatusChange from deps - using ref instead

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Auto-check only if shouldAutoCheck is true (not for compact mode by default)
    useEffect(() => {
        if (apiKey && shouldAutoCheck) {
            checkUsage();
        }
    }, [apiKey, shouldAutoCheck, checkUsage]);

    const getStatusIcon = () => {
        if (isLoading) {
            return <CircleNotch size={14} className="animate-spin text-muted-foreground" />;
        }

        switch (usage?.status) {
            case 'ok':
                return <CheckCircle size={14} weight="fill" className="text-green-500" />;
            case 'warning':
                return <Warning size={14} weight="fill" className="text-yellow-500" />;
            case 'error':
                return <XCircle size={14} weight="fill" className="text-red-500" />;
            default:
                return <Info size={14} className="text-muted-foreground" />;
        }
    };

    const getStatusColor = () => {
        switch (usage?.status) {
            case 'ok':
                return 'bg-green-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-muted-foreground';
        }
    };

    const getUsageBarColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toString();
    };

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                checkUsage();
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            disabled={isLoading}
                        >
                            {getStatusIcon()}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[250px]">
                        <div className="space-y-1">
                            <div className="font-medium capitalize">{provider} Status</div>
                            <div className="text-xs text-muted-foreground">
                                {usage?.message || 'Click to check'}
                            </div>
                            {usage?.usage && (
                                <div className="text-xs mt-1">
                                    Tokens: {formatNumber(usage.usage.tokens.used)} / {formatNumber(usage.usage.tokens.limit)}
                                </div>
                            )}
                            {lastChecked && (
                                <div className="text-[10px] text-muted-foreground mt-1">
                                    Checked {lastChecked.toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className="space-y-2">
            {/* Header with status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className="text-sm font-medium capitalize">{provider}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => checkUsage(true)}
                    disabled={isLoading}
                >
                    <ArrowClockwise size={12} className={isLoading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Status message */}
            {usage?.message && (
                <p className={`text-xs ${usage.status === 'error' ? 'text-red-500' : usage.status === 'warning' ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                    {usage.message}
                </p>
            )}

            {/* Usage bars */}
            {usage?.usage && (
                <div className="space-y-1.5">
                    {/* Token usage */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Tokens</span>
                            <span>{formatNumber(usage.usage.tokens.used)} / {formatNumber(usage.usage.tokens.limit)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${getUsageBarColor(usage.usage.tokens.percentUsed)}`}
                                style={{ width: `${Math.min(100, usage.usage.tokens.percentUsed)}%` }}
                            />
                        </div>
                    </div>

                    {/* Request usage (if meaningful) */}
                    {usage.usage.requests.limit > 0 && (
                        <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Requests</span>
                                <span>{usage.usage.requests.used} / {usage.usage.requests.limit}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${getUsageBarColor(usage.usage.requests.percentUsed)}`}
                                    style={{ width: `${Math.min(100, usage.usage.requests.percentUsed)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Last checked */}
            {lastChecked && (
                <p className="text-[10px] text-muted-foreground">
                    Last checked: {lastChecked.toLocaleTimeString()}
                </p>
            )}
        </div>
    );
}

/**
 * Multi-provider usage dashboard
 */
interface UsageDashboardProps {
    apiKeys: {
        groq?: string;
        gemini?: string;
        openai?: string;
    };
    activeProvider: 'groq' | 'gemini' | 'openai';
}

export function UsageDashboard({ apiKeys, activeProvider }: UsageDashboardProps) {
    const providers = ['groq', 'gemini', 'openai'] as const;
    const configuredProviders = providers.filter(p => apiKeys[p]);

    if (configuredProviders.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground">
                <p>No API keys configured</p>
                <p className="text-xs mt-1">Add an API key to see usage stats</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info size={12} />
                <span>API Usage & Limits</span>
            </div>

            <div className="space-y-3">
                {configuredProviders.map(provider => (
                    <div
                        key={provider}
                        className={`p-3 rounded-lg border transition-colors ${provider === activeProvider
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-muted/30'
                            }`}
                    >
                        <UsageIndicator
                            provider={provider}
                            apiKey={apiKeys[provider]}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
