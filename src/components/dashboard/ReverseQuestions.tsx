import { Question, ArrowsClockwise, ChatTeardropText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReverseQuestionsProps {
    questions: string[];
    onRegenerate: () => void;
}

export function ReverseQuestions({ questions, onRegenerate }: ReverseQuestionsProps) {
    return (
        <section className="animate-in fade-in pt-8 border-t border-border">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Questions for Interviewer</h3>
                <Button variant="ghost" size="sm" onClick={onRegenerate} className="text-xs">
                    <ArrowsClockwise size={14} className="mr-1" /> Regenerate
                </Button>
            </div>

            <div className="space-y-4">
                {questions.length > 0 ? (
                    questions.map((q, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-xs text-muted-foreground pt-0.5 w-6 flex-shrink-0">
                                {i + 1}.
                            </span>
                            <p className="text-sm flex-1">{q}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-muted-foreground col-span-1 py-4 text-center text-sm md:col-span-2">Generating questions...</div>
                )}
            </div>
        </section>
    );
}
