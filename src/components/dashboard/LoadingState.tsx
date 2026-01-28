interface LoadingStateProps {
    message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
    return (
        <div className="text-center py-20 fade-in">
            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-muted-foreground text-lg font-medium" id="loading-text">{message}</p>
        </div>
    );
}
