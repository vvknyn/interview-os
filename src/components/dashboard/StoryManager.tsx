import { useState } from "react";
import { StarStory } from "@/types";
import { StoryCard } from "./StoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "@phosphor-icons/react";

interface StoryManagerProps {
    stories: StarStory[];
    onChange: (stories: StarStory[]) => void;
}

export function StoryManager({ stories, onChange }: StoryManagerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentStory, setCurrentStory] = useState<StarStory | null>(null);

    const handleAdd = () => {
        setCurrentStory({
            id: crypto.randomUUID(),
            title: "",
            situation: "",
            task: "",
            action: "",
            result: ""
        });
        setIsEditing(true);
    };

    const handleEdit = (story: StarStory) => {
        setCurrentStory({ ...story });
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        // Mark as deleted instead of removing, so we can persist the deletion
        const updatedStories = stories.map(s =>
            s.id === id ? { ...s, deleted: true } : s
        );
        onChange(updatedStories);
    };

    const handleSave = () => {
        if (!currentStory) return;

        const index = stories.findIndex(s => s.id === currentStory.id);
        if (index >= 0) {
            const newStories = [...stories];
            newStories[index] = currentStory;
            onChange(newStories);
        } else {
            onChange([...stories, currentStory]);
        }
        setIsEditing(false);
        setCurrentStory(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentStory(null);
    };

    if (isEditing && currentStory) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Story Title</label>
                    <Input
                        value={currentStory.title}
                        onChange={e => setCurrentStory({ ...currentStory, title: e.target.value })}
                        placeholder="e.g. Project Phoenix"
                        className="bg-white"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-bold text-indigo-600 mb-1 block uppercase">Situation</label>
                        <Textarea
                            value={currentStory.situation}
                            onChange={e => setCurrentStory({ ...currentStory, situation: e.target.value })}
                            placeholder="What was the context?"
                            className="bg-white h-20 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-600 mb-1 block uppercase">Task</label>
                        <Textarea
                            value={currentStory.task}
                            onChange={e => setCurrentStory({ ...currentStory, task: e.target.value })}
                            placeholder="What was your specific responsibility?"
                            className="bg-white h-20 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-600 mb-1 block uppercase">Action</label>
                        <Textarea
                            value={currentStory.action}
                            onChange={e => setCurrentStory({ ...currentStory, action: e.target.value })}
                            placeholder="What actions did you take?"
                            className="bg-white h-24 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-600 mb-1 block uppercase">Result</label>
                        <Textarea
                            value={currentStory.result}
                            onChange={e => setCurrentStory({ ...currentStory, result: e.target.value })}
                            placeholder="What was the outcome (quantified if possible)?"
                            className="bg-white h-20 text-xs"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button variant="ghost" onClick={handleCancel} size="sm">Cancel</Button>
                    <Button onClick={handleSave} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Story</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories
                .filter(s => !s.deleted)
                .map(story => (
                    <StoryCard
                        key={story.id}
                        story={story}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}

            <button
                onClick={handleAdd}
                className="flex flex-col items-center justify-center w-full max-w-[320px] p-8 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all group min-h-[200px]"
            >
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center mb-3 transition-colors">
                    <Plus size={24} weight="bold" />
                </div>
                <span className="font-bold text-sm">Add New Story</span>
            </button>
        </div>
    );
}
