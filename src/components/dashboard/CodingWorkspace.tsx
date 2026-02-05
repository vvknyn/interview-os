"use client";

import { useState } from "react";
import { CodingChallenge } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Simple editor for V1
import { Code, Play, CheckCircle, Warning, CircleNotch } from "@phosphor-icons/react";
import { generateCodeFeedback } from "@/actions/generate-context";
import MarkdownIt from "markdown-it";

interface CodingWorkspaceProps {
    challenge: CodingChallenge;
}

export function CodingWorkspace({ challenge }: CodingWorkspaceProps) {
    const [code, setCode] = useState(challenge.starter_code);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const md = new MarkdownIt({ html: true, breaks: true, linkify: true });

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setFeedback(null);
        try {
            const result = await generateCodeFeedback(code, challenge.description);
            setFeedback(result);
        } catch (e: any) {
            console.error(e);
            setFeedback(`Error: ${e.message || "Failed to analyze code."}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col lg:flex-row h-[600px] lg:h-[700px]">
            {/* Left Pane: Problem Description */}
            <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto bg-muted/10">
                {/* Header removed to avoid duplication */}

                <h3 className="text-xl font-bold mb-4">{challenge.title}</h3>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-muted-foreground">
                    <div dangerouslySetInnerHTML={{ __html: md.render(challenge.description) }} />
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Examples</h4>
                        <div className="space-y-2">
                            {challenge.examples.map((ex: any, i) => (
                                <div key={i} className="bg-background border border-border p-2 rounded text-xs font-mono whitespace-pre-wrap">
                                    {typeof ex === 'string' ? ex : (
                                        <>
                                            <span className="text-muted-foreground">In:</span> {ex.in || ex.input} <br />
                                            <span className="text-muted-foreground">Out:</span> {ex.out || ex.output}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Constraints</h4>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {challenge.constraints.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Pane: Editor & Feedback */}
            <div className="lg:w-2/3 flex flex-col">
                <div className="flex-1 bg-[#1e1e1e] p-0 relative group">
                    {/* Simple header for editor */}
                    <div className="absolute top-0 left-0 right-0 h-10 bg-[#2d2d2d] flex items-center px-4 text-xs text-gray-400 border-b border-[#3e3e3e] select-none z-10">
                        <span className="font-mono">solution.js</span>
                    </div>

                    <Textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-full pt-12 p-4 bg-transparent text-gray-200 font-mono text-sm resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
                        spellCheck="false"
                    />
                </div>

                {/* Bottom Bar / Feedback Area */}
                <div className="border-t border-border bg-background p-4 flex-shrink-0">
                    {!feedback ? (
                        <div className="flex flex-col items-end gap-2 text-right">
                            {isAnalyzing && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                    <CircleNotch className="animate-spin" />
                                    <span>Running tests & analyzing code...</span>
                                </div>
                            )}
                            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="min-w-[140px]">
                                {isAnalyzing ? "Processing..." : (
                                    <>
                                        <Play className="mr-2" size={16} weight="fill" /> Run & Analyze
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <CheckCircle className="text-green-500" size={18} weight="fill" />
                                    AI Feedback
                                </h4>
                                <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-6 text-xs">
                                    Close
                                </Button>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/90 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                                {feedback}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
