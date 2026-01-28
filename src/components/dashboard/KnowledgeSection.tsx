"use client";

import { useState } from "react";
import { TechnicalData } from "@/types";
import { Button } from "@/components/ui/button";
import { CaretDown, Lightbulb, GraduationCap, CaretUp } from "@phosphor-icons/react";

interface KnowledgeSectionProps {
    data: TechnicalData;
    onExplain: (question: string) => Promise<string>;
}

export function KnowledgeSection({ data, onExplain }: KnowledgeSectionProps) {
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingExpl, setLoadingExpl] = useState<string | null>(null);
    const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

    const toggleItem = (index: number) => {
        setOpenItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

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

    return (
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <GraduationCap size={24} weight="duotone" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Technical Knowledge Base</h2>
                    <p className="text-sm text-muted-foreground">Key concepts to master for this role</p>
                </div>
            </div>

            <div className="space-y-4">
                {data.questions.map((item, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4 bg-background hover:border-purple-300 transition-colors">
                        <div
                            className="flex justify-between items-start gap-4 mb-2 cursor-pointer"
                            onClick={() => toggleItem(idx)}
                        >
                            <h3 className="font-medium text-foreground">{item.question}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {item.topic}
                                </span>
                                {openItems[idx] ? <CaretUp size={16} /> : <CaretDown size={16} />}
                            </div>
                        </div>

                        {openItems[idx] && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <Lightbulb size={16} className="text-yellow-500" />
                                    <span>Look for: {item.context_clue}</span>
                                </div>

                                {explanations[idx] ? (
                                    <div className="mt-3 p-3 bg-muted/40 rounded-lg text-sm text-foreground/90 leading-relaxed border border-border">
                                        <p className="font-semibold text-xs text-purple-600 mb-1">AI Explanation:</p>
                                        {explanations[idx]}
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGetExplanation(item.question, idx);
                                        }}
                                        disabled={loadingExpl === item.question}
                                        className="w-full mt-2 h-8 text-xs font-normal"
                                    >
                                        {loadingExpl === item.question ? "Generating explanation..." : "Explain this concept"}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
