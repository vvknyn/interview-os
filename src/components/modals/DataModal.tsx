import { X, FilePdf } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChangeEvent } from "react";
import { StarStory } from "@/types";
import { StoryManager } from "../dashboard/StoryManager";

interface DataModalProps {
    isOpen: boolean;
    onClose: () => void;
    resume: string;
    setResume: (value: string) => void;
    stories: StarStory[];
    setStories: (value: StarStory[]) => void;
    onSave: () => void;
}

export function DataModal({ isOpen, onClose, resume, setResume, stories, setStories, onSave }: DataModalProps) {

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'resume') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            alert("PDF extraction would happen here via AI. Please paste text for now.");
        } else {
            const text = await file.text();
            setResume(text);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-background max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-semibold">Manage Resume & Data</DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Resume Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Resume Context</label>
                                <Button variant="ghost" size="sm" onClick={() => setResume("")} className="text-xs text-destructive hover:text-destructive h-6 px-2">Clear</Button>
                            </div>
                            <label className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors flex items-center gap-1">
                                <FilePdf size={14} /> Upload PDF / Text
                                <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={(e) => handleFileUpload(e, 'resume')} />
                            </label>
                        </div>
                        <Textarea
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                            className="w-full h-40 p-3 text-xs font-mono bg-muted/30 border border-border rounded-md resize-none"
                            placeholder="Paste your resume here or upload a PDF..."
                        />
                    </div>

                    {/* Stories Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-medium">STAR Stories Library</label>
                        </div>
                        <StoryManager stories={stories} onChange={setStories} />
                    </div>
                </div>

                <DialogFooter className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave}>Save & Refresh Matches</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
