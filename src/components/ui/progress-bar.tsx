import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    progress: number
    label?: string
}

export function ProgressBar({ progress, label, className, ...props }: ProgressBarProps) {
    return (
        <div className={cn("w-full space-y-2", className)} {...props}>
            {label && (
                <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>{label}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            )}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
        </div>
    )
}
