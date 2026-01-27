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
        onChange(stories.filter(s => s.id !== id));
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {stories.map(story => (
                    <StoryCard
                        key={story.id}
                        story={story}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {stories.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm mb-2">No stories added yet.</p>
                </div>
            )}

            <Button onClick={handleAdd} className="w-full bg-slate-900 text-white hover:bg-indigo-600 gap-2">
                <Plus size={16} /> Add New Story
            </Button>
        </div>
    );
}
