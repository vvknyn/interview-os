interface LoadingStateProps {
    message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
    return (
        <div className="text-center py-16 fade-in flex flex-col items-center gap-4">
            <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}
