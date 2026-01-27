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
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Question size={24} className="text-teal-600" /> Strategic Questions to Ask
                </h3>
                <Button
                    variant="outline"
                    onClick={onRegenerate}
                    size="sm"
                    className="w-full md:w-auto justify-center text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 border-gray-200 gap-1 shadow-sm group h-9"
                >
                    <ArrowsClockwise size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Regenerate
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.length > 0 ? (
                    questions.map((q, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
                            <div className="min-w-[24px] mt-1 text-teal-600">
                                <ChatTeardropText size={24} />
                            </div>
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">"{q}"</p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-1 md:col-span-2 text-center text-sm text-gray-400 py-4">Generating questions...</div>
                )}
            </div>
        </section>
    );
}
