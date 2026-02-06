"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FloppyDisk, Tag, Note } from "@phosphor-icons/react";
import { ResumeData } from "@/types/resume";
import { SaveVersionInput } from "@/actions/tailor-resume";

interface SaveVersionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resumeData: ResumeData;
    onSave: (version: SaveVersionInput) => Promise<void>;
}

export function SaveVersionModal({ open, onOpenChange, resumeData, onSave }: SaveVersionModalProps) {
    const [versionName, setVersionName] = useState("");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate a default version name
    const generateDefaultName = () => {
        const date = new Date();
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `Snapshot - ${dateStr}`;
    };

    const handleSave = async () => {
        const finalName = versionName.trim() || generateDefaultName();

        setIsSaving(true);
        setError(null);

        try {
            // Create a snapshot version (no job analysis linked)
            const version: SaveVersionInput = {
                versionName: finalName,
                // Snapshot the current resume state as "original"
                originalSummary: resumeData.generatedSummary || "",
                originalExperience: resumeData.experience || [],
                originalCompetencies: resumeData.competencies || [],
                originalProfile: resumeData.profile,
                originalEducation: resumeData.education || [],
                sectionOrder: resumeData.sectionOrder || ['summary', 'experience', 'skills', 'education'],
                // For snapshots, tailored = original (no modifications)
                tailoredSummary: resumeData.generatedSummary || "",
                tailoredExperience: resumeData.experience || [],
                tailoredCompetencies: resumeData.competencies || [],
                // Mark as snapshot (no job info)
                jobAnalysisId: null, // Explicitly null for snapshots
                companyName: notes ? "Snapshot" : "Manual Save",
                positionTitle: notes || "Resume snapshot",
                recommendations: [],
                appliedAt: new Date().toISOString(),
            };

            await onSave(version);

            // Reset and close
            setVersionName("");
            setNotes("");
            onOpenChange(false);
        } catch (e) {
            console.error("Failed to save version:", e);
            setError(e instanceof Error ? e.message : "Failed to save version");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FloppyDisk size={20} />
                        Save Resume Version
                    </DialogTitle>
                    <DialogDescription>
                        Create a snapshot of your current resume. You can restore or compare versions later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Version Name */}
                    <div className="space-y-2">
                        <Label htmlFor="versionName" className="flex items-center gap-1.5">
                            <Tag size={14} />
                            Version Name
                        </Label>
                        <Input
                            id="versionName"
                            placeholder={generateDefaultName()}
                            value={versionName}
                            onChange={(e) => setVersionName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave blank to use default: "{generateDefaultName()}"
                        </p>
                    </div>

                    {/* Notes (optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-1.5">
                            <Note size={14} />
                            Notes (optional)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="What changes did you make? Why are you saving this version?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Preview of what will be saved */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Version will include:
                        </p>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Profile: {resumeData.profile?.profession || "Not set"}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {resumeData.experience?.length || 0} experience entries
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {resumeData.competencies?.length || 0} skill categories
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {resumeData.education?.length || 0} education entries
                            </li>
                            {resumeData.generatedSummary && (
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    AI-generated summary
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Version"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
