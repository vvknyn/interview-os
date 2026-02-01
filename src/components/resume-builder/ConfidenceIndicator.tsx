"use client";

import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
    score: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Color-coded confidence badge:
 * - Green (90%+): High confidence - auto-accepted
 * - Yellow (70-89%): Medium confidence - "Review suggested"
 * - Red (<70%): Low confidence - "Manual edit required"
 */
export function ConfidenceIndicator({ score, showLabel = true, size = 'md', className }: ConfidenceIndicatorProps) {
    const getConfidenceLevel = (score: number) => {
        if (score >= 90) return { level: 'high', label: 'High confidence', color: 'bg-green-500', textColor: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/30', borderColor: 'border-green-200 dark:border-green-800' };
        if (score >= 70) return { level: 'medium', label: 'Review suggested', color: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', borderColor: 'border-yellow-200 dark:border-yellow-800' };
        return { level: 'low', label: 'Manual edit required', color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-800' };
    };

    const { level, label, color, textColor, bgColor, borderColor } = getConfidenceLevel(score);

    const sizeClasses = {
        sm: { badge: 'h-5 text-[10px] px-1.5', dot: 'w-1.5 h-1.5' },
        md: { badge: 'h-6 text-xs px-2', dot: 'w-2 h-2' },
        lg: { badge: 'h-7 text-sm px-2.5', dot: 'w-2.5 h-2.5' }
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border",
                bgColor,
                borderColor,
                sizeClasses[size].badge,
                className
            )}
        >
            <span className={cn("rounded-full shrink-0", color, sizeClasses[size].dot)} />
            {showLabel && (
                <span className={cn("font-medium whitespace-nowrap", textColor)}>
                    {label}
                </span>
            )}
            <span className={cn("font-semibold", textColor)}>
                {score}%
            </span>
        </div>
    );
}

interface ConfidenceBadgeProps {
    score: number;
    section: string;
    className?: string;
}

/**
 * Compact badge for inline use in forms
 */
export function ConfidenceBadge({ score, section, className }: ConfidenceBadgeProps) {
    const getColor = (score: number) => {
        if (score >= 90) return 'text-green-600 dark:text-green-400';
        if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getDot = (score: number) => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <span
            className={cn("inline-flex items-center gap-1 text-xs", getColor(score), className)}
            title={`${section}: ${score}% confidence`}
        >
            <span className={cn("w-1.5 h-1.5 rounded-full", getDot(score))} />
            {score}%
        </span>
    );
}

interface WarningBannerProps {
    warnings: string[];
    className?: string;
    onDismiss?: () => void;
}

/**
 * Warning banner for overall parsing issues
 */
export function WarningBanner({ warnings, className, onDismiss }: WarningBannerProps) {
    if (warnings.length === 0) return null;

    return (
        <div
            className={cn(
                "p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Parsing Warnings
                    </h4>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                        {warnings.map((warning, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-yellow-500 mt-0.5">•</span>
                                {warning}
                            </li>
                        ))}
                    </ul>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
