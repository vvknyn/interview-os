import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface ContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: string;
    setContext: (value: string) => void;
    onSave: () => void;
}

export function ContextModal({ isOpen, onClose, context, setContext, onSave }: ContextModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-white">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                    <DialogTitle className="text-lg font-bold text-gray-800">Tweak Interview Context</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-500">
                        Paste specific instructions from the recruiter, job description details, or topics to focus on (e.g. &quot;Focus on System Design&quot;, &quot;Email said they ask about leadership&quot;).
                    </p>
                    <Textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full h-32 p-3 text-sm bg-white border border-gray-200 rounded-lg focus-visible:ring-indigo-500 resize-none"
                        placeholder="e.g. The interviewer is a VP of Engineering. Focus heavily on distributed caching strategies..."
                    />
                </div>
                <DialogFooter className="bg-gray-50 -mx-6 -mb-6 p-4 border-t border-gray-100 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800">Cancel</Button>
                    <Button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Save & Regenerate</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
