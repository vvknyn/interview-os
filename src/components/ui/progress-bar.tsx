import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    progress: number
    label?: string
}

export function ProgressBar({ progress, className, ...props }: ProgressBarProps) {
    return (
        <div className={cn("w-full", className)} {...props}>
            <div className="h-px w-full bg-border overflow-hidden">
                <div
                    className="h-full bg-foreground transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
        </div>
    )
}
