import { StarStory } from "@/types";


interface StoryCardProps {
    story: StarStory;
    onEdit: (story: StarStory) => void;
    onDelete: (id: string) => void;
}

export function StoryCard({ story, onEdit, onDelete }: StoryCardProps) {
    return (
        <div className="w-full max-w-[320px] rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-center gap-4">
                <span className="flex shrink-0 items-center justify-center rounded-full bg-blue-400 p-2 text-white">
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path clipRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" fillRule="evenodd"></path>
                    </svg>
                </span>
                <p className="font-semibold text-slate-500 line-clamp-1" title={story.title}>{story.title || "Untitled Story"}</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-500">
                <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-0.5">Situation</span>
                    <p className="line-clamp-2">{story.situation}</p>
                </div>
                <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-0.5">Task</span>
                    <p className="line-clamp-2">{story.task}</p>
                </div>
                <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-0.5">Action</span>
                    <p className="line-clamp-2">{story.action}</p>
                </div>
                <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-0.5">Result</span>
                    <p className="line-clamp-2">{story.result}</p>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={() => onEdit(story)}
                    className="block w-full rounded-lg bg-blue-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                >
                    Edit Story
                </button>

                <button
                    onClick={() => onDelete(story.id)}
                    className="mt-2 block w-full rounded-lg bg-gray-50 py-3 text-center text-sm font-semibold text-gray-500 transition-all hover:bg-gray-100"
                >
                    Delete Story
                </button>
            </div>
        </div>
    );
}
