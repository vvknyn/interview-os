import { StarStory } from "@/types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "@phosphor-icons/react";

interface StoryCardProps {
    story: StarStory;
    onEdit: (story: StarStory) => void;
    onDelete: (id: string) => void;
}

export function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
    return (
        <div className="card-premium p-4 group relative">
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-800 text-sm">{story.title}</h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600" onClick={() => onEdit(story)}>
                        <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600" onClick={() => onDelete(story.id)}>
                        <Trash size={14} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
                <div>
                    <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider block mb-1">Situation</span>
                    <p className="text-slate-600 leading-relaxed">{story.situation}</p>
                </div>
                <div>
                    <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider block mb-1">Task</span>
                    <p className="text-slate-600 leading-relaxed">{story.task}</p>
                </div>
                <div>
                    <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider block mb-1">Action</span>
                    <p className="text-slate-600 leading-relaxed">{story.action}</p>
                </div>
                <div>
                    <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider block mb-1">Result</span>
                    <p className="text-slate-600 leading-relaxed">{story.result}</p>
                </div>
            </div>
        </div>
    );
}
