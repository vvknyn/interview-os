import { ArrowsClockwise, Question, ChatTeardropText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DashboardSection } from "./DashboardSection";

type QuestionItem = string | { type?: string; desc?: string; question?: string; context?: string } | Record<string, string>;

interface ReverseQuestionsProps {
    questions: QuestionItem[];
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

export function ReverseQuestions({ questions }: ReverseQuestionsProps) {

    const normalizedQuestions = useMemo(() => normalizeQuestions(questions), [questions]);

    return (
        <DashboardSection
            title="Reverse Interview"
            subtitle="Strategic questions to ask your interviewer"
            icon={Question}
        >
            <div className="space-y-3">
                {normalizedQuestions.length > 0 ? (
                    normalizedQuestions.map((q, i) => (
                        <div
                            key={i}
                            className="group relative bg-muted/20 hover:bg-muted/40 rounded-xl p-4 transition-all duration-150 flex gap-4 overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                        >
                            {/* Number / Icon */}
                            <div className="shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center text-xs font-mono font-medium text-muted-foreground group-hover:text-brand transition-colors shadow-sm">
                                    {i + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 py-0.5">
                                    {q.category && (
                                        <div className="mb-1.5 flex items-center">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-md">
                                                {q.category}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                        "{q.text}"
                                    </p>
                                </div>

                            {/* Hover accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-brand/50 transition-colors duration-150 rounded-full" />
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
        </DashboardSection>
    );
}
