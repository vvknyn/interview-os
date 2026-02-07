"use client";

import { useState } from "react";
import { TechnicalData } from "@/types";
import { Button } from "@/components/ui/button";
import { Lightbulb, GraduationCap, PlusCircle, MinusCircle, CircleNotch } from "@phosphor-icons/react";

interface KnowledgeSectionProps {
    data: TechnicalData;
    onExplain: (question: string) => Promise<string>;
}

export function KnowledgeSection({ data, onExplain }: KnowledgeSectionProps) {
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingExpl, setLoadingExpl] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    const handleGetExplanation = async (question: string, index: number) => {
        if (explanations[index]) return;
        setLoadingExpl(question);
        try {
            const explanation = await onExplain(question);
            setExplanations(prev => ({ ...prev, [index]: explanation }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingExpl(null);
        }
    };

    const toggleExplanation = (index: number) => {
        setExpandedItem(prev => prev === index ? null : index);
        if (expandedItem !== index && !explanations[index]) {
            handleGetExplanation(data.questions[index].question, index);
        }
    };

    return (
        <section className="animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.questions.map((item, index) => (
                    <div
                        key={index}
                        className="bg-card rounded-xl p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-150 cursor-pointer group"
                        onClick={() => toggleExplanation(index)}
                    >
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="font-semibold text-base text-foreground/90 group-hover:text-brand transition-colors leading-snug">
                                {item.question}
                            </h3>
                            <div className="text-muted-foreground group-hover:text-brand transition-colors mt-0.5 shrink-0">
                                {expandedItem === index ? (
                                    <MinusCircle size={22} weight="light" />
                                ) : (
                                    <PlusCircle size={22} weight="light" />
                                )}
                            </div>
                        </div>

                        {expandedItem === index ? (
                            <div className="animate-in slide-in-from-top-2 pt-2 cursor-default" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full w-fit mb-4">
                                    <Lightbulb size={14} weight="fill" />
                                    Look for: {item.context_clue}
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4">
                                    {loadingExpl === item.question ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CircleNotch className="animate-spin" size={16} />
                                            Generating explanation...
                                        </div>
                                    ) : explanations[index] ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <div dangerouslySetInnerHTML={{ __html: explanations[index] }} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CircleNotch className="animate-spin" size={16} />
                                            Loading interpretation...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground/60">
                                    {item.topic}
                                </span>
                                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to expand
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
