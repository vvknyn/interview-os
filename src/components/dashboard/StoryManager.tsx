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
                    <label className="text-xs font-bold text-foreground mb-1 block">Story Title</label>
                    <Input
                        value={currentStory.title}
                        onChange={e => setCurrentStory({ ...currentStory, title: e.target.value })}
                        placeholder="e.g. Project Phoenix"
                        className="bg-background"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Situation</label>
                        <Textarea
                            value={currentStory.situation}
                            onChange={e => setCurrentStory({ ...currentStory, situation: e.target.value })}
                            placeholder="What was the context?"
                            className="bg-background h-20 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Task</label>
                        <Textarea
                            value={currentStory.task}
                            onChange={e => setCurrentStory({ ...currentStory, task: e.target.value })}
                            placeholder="What was your specific responsibility?"
                            className="bg-background h-20 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Action</label>
                        <Textarea
                            value={currentStory.action}
                            onChange={e => setCurrentStory({ ...currentStory, action: e.target.value })}
                            placeholder="What actions did you take?"
                            className="bg-background h-24 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Result</label>
                        <Textarea
                            value={currentStory.result}
                            onChange={e => setCurrentStory({ ...currentStory, result: e.target.value })}
                            placeholder="What was the outcome (quantified if possible)?"
                            className="bg-background h-20 text-xs"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" onClick={handleCancel} size="sm">Cancel</Button>
                    <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Save Story</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button
                    onClick={handleAdd}
                    variant="outline"
                    className="border-dashed border-border hover:border-primary hover:text-primary text-muted-foreground"
                >
                    <Plus size={16} weight="bold" className="mr-2" /> Add New Story
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {stories.filter(s => !s.deleted).length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground font-medium">No stories added yet.</p>
                        <Button onClick={handleAdd} variant="link" className="text-primary mt-2">Create your first story</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
