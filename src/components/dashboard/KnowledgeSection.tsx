"use client";

import { useState } from "react";
import { TechnicalData } from "@/types";
import { Button } from "@/components/ui/button";
import { CaretDown, Lightbulb, GraduationCap, CaretUp, PlusCircle, MinusCircle, CircleNotch } from "@phosphor-icons/react";

interface KnowledgeSectionProps {
    data: TechnicalData;
    onExplain: (question: string) => Promise<string>;
}

export function KnowledgeSection({ data, onExplain }: KnowledgeSectionProps) {
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingExpl, setLoadingExpl] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    const handleGetExplanation = async (question: string, index: number) => {
        if (explanations[index]) return; // Already fetched
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
        // Pre-fetch if opening
        if (expandedItem !== index && !explanations[index]) {
            handleGetExplanation(data.questions[index].question, index);
        }
    };

    return (
        <section className="animate-in fade-in pt-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <GraduationCap size={20} weight="fill" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Technical Knowledge</h2>
                    <p className="text-sm text-muted-foreground">Key concepts to master for this role</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.questions.map((item, index) => (
                    <div
                        key={index}
                        className="bg-card/50 rounded-xl p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => toggleExplanation(index)}
                    >
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="font-semibold text-lg text-foreground/90 group-hover:text-primary transition-colors">
                                {item.question}
                            </h3>
                            <div className="text-muted-foreground group-hover:text-primary transition-colors mt-1">
                                {expandedItem === index ? (
                                    <MinusCircle size={24} weight="light" />
                                ) : (
                                    <PlusCircle size={24} weight="light" />
                                )}
                            </div>
                        </div>

                        {expandedItem === index ? (
                            <div className="animate-in slide-in-from-top-2 pt-2 cursor-default" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full w-fit mb-4">
                                    <Lightbulb size={14} weight="fill" />
                                    Look for: {item.context_clue}
                                </div>

                                <div className="bg-secondary/30 rounded-lg p-5">
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
                            <div className="flex items-center justify-between mt-4">
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
