import { Question, ArrowsClockwise, ChatTeardropText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type QuestionItem = string | { type?: string; desc?: string; question?: string; context?: string };

interface ReverseQuestionsProps {
    questions: QuestionItem[];
    onRegenerate: () => void;
}

// Helper to extract question text from various formats
function getQuestionText(q: QuestionItem): string {
    if (typeof q === 'string') return q;
    return q.desc || q.question || q.type || JSON.stringify(q);
}

export function ReverseQuestions({ questions, onRegenerate }: ReverseQuestionsProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);

    return (
        <section className="animate-in fade-in pt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Questions for Interviewer</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        setIsRegenerating(true);
                        await onRegenerate();
                        setIsRegenerating(false);
                    }}
                    disabled={isRegenerating}
                    className="text-xs"
                >
                    <ArrowsClockwise size={14} className={cn("mr-1", isRegenerating && "animate-spin")} />
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
            </div>

            <div className="space-y-4">
                {questions.length > 0 ? (
                    questions.map((q, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-xs text-muted-foreground pt-0.5 w-6 flex-shrink-0">
                                {i + 1}.
                            </span>
                            <p className="text-sm flex-1">{getQuestionText(q)}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-muted-foreground col-span-1 py-4 text-center text-sm md:col-span-2">Generating questions...</div>
                )}
            </div>
        </section>
    );
}
