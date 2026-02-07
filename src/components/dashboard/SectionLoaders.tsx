import { ProgressBar } from "@/components/ui/progress-bar";
import { useEffect, useState } from "react";

interface SectionLoaderProps {
    message: string;
}

export function SectionLoader({ message }: SectionLoaderProps) {
    const [progress, setProgress] = useState(10);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                const increment = prev < 50 ? 10 : prev < 80 ? 5 : 1;
                return Math.min(95, prev + increment);
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <div className="w-full max-w-md space-y-4">
                <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Processing</span>
                    <span>{progress}%</span>
                </div>
                <ProgressBar progress={progress} className="h-2 rounded-full bg-secondary" />
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                    {message}
                </p>
            </div>
        </div>
    );
}

export function QuestionsLoader() {
    return <SectionLoader message="Generating Interview Questions..." />;
}

export function ReverseQuestionsLoader() {
    return <SectionLoader message="Drafting Reverse Questions..." />;
}
