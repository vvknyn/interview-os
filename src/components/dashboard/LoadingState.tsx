interface LoadingStateProps {
    message: string;
}

const TIPS = [
    "Preparing your personalized strategy...",
    "Analyzing company culture & values...",
    "Crafting targeted interview questions...",
    "Building your match narrative...",
];

export function LoadingState({ message }: LoadingStateProps) {
    return (
        <div className="text-center py-20 fade-in flex flex-col items-center gap-5">
            <div className="relative">
                <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div>
            </div>
            <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">{message}</p>
                <p className="text-muted-foreground text-xs">This usually takes 10-20 seconds</p>
            </div>
        </div>
    );
}
