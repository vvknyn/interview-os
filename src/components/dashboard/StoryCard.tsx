import { StarStory } from "@/types";


interface StoryCardProps {
    story: StarStory;
    onEdit: (story: StarStory) => void;
    onDelete: (id: string) => void;
}

export function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
    return (
        <div className="bg-card border-border hover:border-primary/50 group flex flex-col justify-between w-full h-full rounded-xl border p-5 transition-all">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-primary/10 text-primary flex shrink-0 h-8 w-8 items-center justify-center rounded-lg">
                        <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                            <path clipRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" fillRule="evenodd"></path>
                        </svg>
                    </span>
                    <h3 className="text-foreground font-semibold line-clamp-1" title={story.title}>{story.title || "Untitled Story"}</h3>
                </div>

                <div className="text-muted-foreground space-y-3 text-xs">
                    <div>
                        <span className="text-foreground/70 font-semibold uppercase tracking-wider text-[10px]">Situation:</span>
                        <p className="line-clamp-2 mt-0.5">{story.situation}</p>
                    </div>
                    <div>
                        <span className="text-foreground/70 font-semibold uppercase tracking-wider text-[10px]">Result:</span>
                        <p className="line-clamp-2 mt-0.5">{story.result}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-2 pt-4 border-t border-border/50">
                <button
                    onClick={() => onEdit(story)}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold py-2 rounded-md transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(story.id)}
                    className="px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-md transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
