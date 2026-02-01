import { ArrowsClockwise, Question, ChatTeardropText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DashboardSection } from "./DashboardSection";

type QuestionItem = string | { type?: string; desc?: string; question?: string; context?: string } | Record<string, string>;

interface ReverseQuestionsProps {
    questions: QuestionItem[];
    onRegenerate: () => void;
}

// Helper to extract question text from various formats
function getQuestionText(q: QuestionItem): string {
    if (typeof q === 'string') return q;
    if (typeof q === 'object' && q !== null) {
        if ('desc' in q) return (q as any).desc;
        if ('question' in q) return (q as any).question;
        if ('type' in q && Object.keys(q).length === 1) return (q as any).type; // Weird case but possible
    }
    return JSON.stringify(q);
}

// Helper to normalize questions data
// Handles cases where the API returns a single object with categories as keys
function normalizeQuestions(questions: QuestionItem[]): { text: string, category?: string }[] {
    if (!questions || questions.length === 0) return [];

    // Check for the weird "single object with categories" case
    if (questions.length === 1 && typeof questions[0] === 'object' && questions[0] !== null) {
        const item = questions[0];
        // If it doesn't look like a standard question item (no desc/question/type), assume it's a map
        if (!('desc' in item) && !('question' in item) && !('type' in item)) {
            // It's likely a map of Category -> Question
            return Object.entries(item).map(([key, value]) => ({
                category: key.replace(/_/g, ' '),
                text: value as string
            }));
        }
    }

    // Standard array processing
    return questions.map(q => {
        if (typeof q === 'string') return { text: q };
        if (typeof q === 'object') {
            const text = getQuestionText(q);
            const category = 'type' in q ? (q as any).type : undefined;
            return { text, category };
        }
        return { text: JSON.stringify(q) };
    });
}

export function ReverseQuestions({ questions, onRegenerate }: ReverseQuestionsProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);

    const normalizedQuestions = useMemo(() => normalizeQuestions(questions), [questions]);

    return (
        <DashboardSection
            title="Reverse Interview"
            subtitle="Strategic questions to ask your interviewer"
            icon={Question}
            action={
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        setIsRegenerating(true);
                        await onRegenerate();
                        setIsRegenerating(false);
                    }}
                    disabled={isRegenerating}
                    className="text-xs h-8 px-2"
                >
                    <ArrowsClockwise
                        size={14}
                        className={cn("mr-2", isRegenerating && "animate-spin")}
                    />
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
            }
        >
            <div className="bg-muted/10 rounded-2xl p-6 md:p-8 border border-border/40 hover:border-border/60 transition-all">
                <div className="space-y-3">
                    {normalizedQuestions.length > 0 ? (
                        normalizedQuestions.map((q, i) => (
                            <div
                                key={i}
                                className="group relative bg-background/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border border-transparent rounded-xl p-4 transition-all duration-200 flex gap-4 overflow-hidden"
                            >
                                {/* Number / Icon */}
                                <div className="shrink-0 w-8 h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center text-xs font-mono font-medium text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-colors">
                                    {i + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 py-0.5">
                                    {q.category && (
                                        <div className="mb-1.5 flex items-center">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-md border border-border/30">
                                                {q.category}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                        "{q.text}"
                                    </p>
                                </div>

                                {/* Hover accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors duration-200" />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="flex justify-center mb-2">
                                <ChatTeardropText size={24} className="opacity-20" />
                            </div>
                            <p className="text-sm">Generating strategic questions...</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardSection>
    );
}
