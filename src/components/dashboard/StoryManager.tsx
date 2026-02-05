"use client";

import { useState } from "react";
import { StarStory } from "@/types";
import { StoryCard } from "./StoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkle, ArrowsClockwise } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryImportModal } from "@/components/settings/StoryImportModal";
import { convertBlobToStar } from "@/actions/parse-stories";

interface StoryManagerProps {
    stories: StarStory[];
    onChange: (stories: StarStory[]) => void;
}

export function StoryManager({ stories, onChange }: StoryManagerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentStory, setCurrentStory] = useState<StarStory | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const handleConvertToStar = async () => {
        if (!currentStory?.content || currentStory.content.trim().length < 20) return;

        setIsConverting(true);
        try {
            const result = await convertBlobToStar(currentStory.content, currentStory.title);
            if (result.data) {
                setCurrentStory({
                    ...currentStory,
                    type: 'star',
                    title: result.data.title || currentStory.title,
                    situation: result.data.situation,
                    task: result.data.task,
                    action: result.data.action,
                    result: result.data.result
                });
            }
        } catch (error) {
            console.error("Failed to convert story:", error);
        } finally {
            setIsConverting(false);
        }
    };

    const handleImportStories = (importedStories: StarStory[]) => {
        // Generate new unique IDs to avoid conflicts with existing stories
        const storiesWithNewIds = importedStories.map(story => ({
            ...story,
            id: crypto.randomUUID()
        }));
        onChange([...stories, ...storiesWithNewIds]);
        setImportModalOpen(false);
    };

    const handleAdd = () => {
        setCurrentStory({
            id: crypto.randomUUID(),
            title: "",
            type: "star",
            content: "",
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


                <Tabs defaultValue={currentStory.type || 'star'} onValueChange={(val) => setCurrentStory({ ...currentStory, type: val as 'star' | 'blob' })} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="star">S.T.A.R. Framework</TabsTrigger>
                        <TabsTrigger value="blob">Free Text Story</TabsTrigger>
                    </TabsList>

                    <TabsContent value="star" className="space-y-4">
                        <div>
                            <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Situation</label>
                            <Textarea
                                value={currentStory.situation || ''}
                                onChange={e => setCurrentStory({ ...currentStory, situation: e.target.value })}
                                placeholder="What was the context?"
                                className="bg-background h-20 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Task</label>
                            <Textarea
                                value={currentStory.task || ''}
                                onChange={e => setCurrentStory({ ...currentStory, task: e.target.value })}
                                placeholder="What was your specific responsibility?"
                                className="bg-background h-20 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Action</label>
                            <Textarea
                                value={currentStory.action || ''}
                                onChange={e => setCurrentStory({ ...currentStory, action: e.target.value })}
                                placeholder="What actions did you take?"
                                className="bg-background h-24 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Result</label>
                            <Textarea
                                value={currentStory.result || ''}
                                onChange={e => setCurrentStory({ ...currentStory, result: e.target.value })}
                                placeholder="What was the outcome (quantified if possible)?"
                                className="bg-background h-20 text-xs"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="blob" className="space-y-4">
                        <div>
                            <label className="text-muted-foreground/70 mb-1 block text-xs font-bold uppercase">Story Content</label>
                            <Textarea
                                value={currentStory.content || ''}
                                onChange={e => setCurrentStory({ ...currentStory, content: e.target.value })}
                                placeholder="Paste your story here - a project you worked on, a challenge you overcame, an achievement you're proud of..."
                                className="bg-background min-h-[250px] text-xs font-mono"
                            />
                        </div>
                        {(currentStory.content || '').trim().length >= 20 && (
                            <div className="bg-muted/30 border border-border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Convert to STAR Format</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            AI will structure your story into Situation, Task, Action, Result
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleConvertToStar}
                                        disabled={isConverting}
                                        size="sm"
                                        className="shrink-0"
                                    >
                                        {isConverting ? (
                                            <>
                                                <ArrowsClockwise size={14} weight="regular" className="mr-1.5 animate-spin" />
                                                Converting...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkle size={14} weight="regular" className="mr-1.5" />
                                                Convert with AI
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" onClick={handleCancel} size="sm">Cancel</Button>
                    <Button onClick={handleSave} size="sm">Save Story</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button
                    onClick={() => setImportModalOpen(true)}
                    variant="outline"
                    className="border-dashed border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                >
                    <Sparkle size={16} weight="regular" className="mr-2" /> Import Stories
                </Button>
                <Button
                    onClick={handleAdd}
                    variant="outline"
                    className="border-dashed border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                >
                    <Plus size={16} weight="regular" className="mr-2" /> Add Story
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
                    <div className="col-span-full py-16 text-center border border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground text-sm">No stories added yet.</p>
                        <p className="text-muted-foreground/70 text-xs mt-1">Add stories manually or import them with AI</p>
                        <div className="flex justify-center gap-2 mt-4">
                            <Button onClick={() => setImportModalOpen(true)} variant="outline" size="sm" className="text-sm">
                                <Sparkle size={14} weight="regular" className="mr-1.5" /> Import with AI
                            </Button>
                            <Button onClick={handleAdd} variant="link" className="text-foreground text-sm">Create manually</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Story Import Modal */}
            <StoryImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={handleImportStories}
            />
        </div>
    );
}
