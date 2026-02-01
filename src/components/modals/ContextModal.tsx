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
            <DialogContent className="sm:max-w-lg bg-background">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                    <DialogTitle className="text-lg font-semibold">Tweak Interview Context</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Paste specific instructions from the recruiter, job description details, or topics to focus on (e.g. &quot;Focus on System Design&quot;, &quot;Email said they ask about leadership&quot;).
                    </p>
                    <Textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full h-32 p-3 text-sm bg-muted/30 border border-border rounded-md resize-none"
                        placeholder="e.g. The interviewer is a VP of Engineering. Focus heavily on distributed caching strategies..."
                    />
                </div>
                <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-4 border-t border-border flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave}>Save & Regenerate</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
