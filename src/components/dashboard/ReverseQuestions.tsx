import { Question, ArrowsClockwise, ChatTeardropText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReverseQuestionsProps {
    questions: string[];
    onRegenerate: () => void;
}

export function ReverseQuestions({ questions, onRegenerate }: ReverseQuestionsProps) {
    return (
        <section className="fade-in delay-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
                    <Question size={24} className="text-primary" /> Strategic Questions to Ask
                </h3>
                <Button
                    variant="outline"
                    onClick={onRegenerate}
                    size="sm"
                    className="bg-background hover:bg-secondary border-border text-muted-foreground w-full justify-center gap-1 text-xs font-bold shadow-none group h-9 md:w-auto"
                >
                    <ArrowsClockwise size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Regenerate
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.length > 0 ? (
                    questions.map((q, i) => (
                        <div key={i} className="bg-card border-border hover:bg-secondary/50 flex items-start gap-3 rounded-xl border p-4 transition-colors">
                            <div className="text-primary mt-1 min-w-[24px]">
                                <ChatTeardropText size={24} />
                            </div>
                            <p className="text-foreground text-sm font-medium leading-relaxed">"{q}"</p>
                        </div>
                    ))
                ) : (
                    <div className="text-muted-foreground col-span-1 py-4 text-center text-sm md:col-span-2">Generating questions...</div>
                )}
            </div>
        </section>
    );
}
