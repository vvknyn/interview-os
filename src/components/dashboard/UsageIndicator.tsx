"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CircleNotch, CheckCircle, Warning, XCircle, Info } from "@phosphor-icons/react";
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
    autoCheck?: boolean;
    onStatusChange?: (status: 'ok' | 'warning' | 'error' | 'unknown') => void;
}

export function UsageIndicator({ provider, apiKey, compact = false, autoCheck, onStatusChange }: UsageIndicatorProps) {
    const [usage, setUsage] = useState<CheckUsageResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const mountedRef = useRef(true);

    const shouldAutoCheck = autoCheck ?? false;

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

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isLoading) checkUsage();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                if (!isLoading) checkUsage();
                            }
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
                        aria-disabled={isLoading}
                    >
                        {getStatusIcon()}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                    <div className="space-y-1">
                        <div className="font-medium capitalize">{provider} Status</div>
                        <div className="text-xs text-muted-foreground">
                            {usage?.message || 'Click to check'}
                        </div>
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
