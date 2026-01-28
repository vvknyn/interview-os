import { StarStory } from "@/types";
import { Button } from "@/components/ui/button";


interface StoryCardProps {
    story: StarStory;
    onEdit: (story: StarStory) => void;
    onDelete: (id: string) => void;
}

export function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
    return (
        <div className="border border-border hover:border-foreground/20 group flex flex-col justify-between w-full h-full rounded-lg p-5 transition-all bg-transparent">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-foreground font-medium text-sm" title={story.title}>{story.title || "Untitled Story"}</h3>
                </div>

                <div className="text-muted-foreground space-y-3 text-xs">
                    <div>
                        <span className="text-muted-foreground/70 font-medium uppercase tracking-wider text-[10px]">Situation:</span>
                        <p className="line-clamp-2 mt-0.5">{story.situation}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground/70 font-medium uppercase tracking-wider text-[10px]">Result:</span>
                        <p className="line-clamp-2 mt-0.5">{story.result}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-2 pt-4 border-t border-border/50">
                <Button
                    onClick={() => onEdit(story)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-border hover:border-foreground/30 hover:bg-muted/50"
                >
                    Edit
                </Button>
                <Button
                    onClick={() => onDelete(story.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}

