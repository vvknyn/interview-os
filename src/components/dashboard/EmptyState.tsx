import { MagnifyingGlass } from "@phosphor-icons/react";

export function EmptyState() {
    return (
        <div className="text-center py-24 fade-in max-w-lg mx-auto">
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand">
                <MagnifyingGlass size={32} weight="duotone" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-3">Ready to prepare?</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                Search for any company and role above to get personalized interview strategies, questions, and insights tailored to your background.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                    <span>Try:</span>
                    <span className="font-medium text-foreground">Google, SWE</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                    <span>or</span>
                    <span className="font-medium text-foreground">Meta, PM</span>
                </div>
            </div>
        </div>
    );
}
