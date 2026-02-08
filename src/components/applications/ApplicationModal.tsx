"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CoverLetterSection } from "./CoverLetterSection";
import { Application, CreateApplicationData, UpdateApplicationData, createApplication, updateApplication } from "@/actions/application";
import { TailoredResumeVersion } from "@/types/resume";
import { fetchTailoredVersions } from "@/actions/tailor-resume";
// import { toast } from "sonner";
import { CircleNotch } from "@phosphor-icons/react";

interface ApplicationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    application?: Application;
    onSuccess: () => void;
}

export function ApplicationModal({ open, onOpenChange, application, onSuccess }: ApplicationModalProps) {
    const [loading, setLoading] = useState(false);
    const [resumeVersions, setResumeVersions] = useState<TailoredResumeVersion[]>([]);

    // Form State
    const [company, setCompany] = useState("");
    const [position, setPosition] = useState("");
    const [jobUrl, setJobUrl] = useState("");
    const [status, setStatus] = useState<string>("applied");
    const [date, setDate] = useState("");
    const [resumeVersionId, setResumeVersionId] = useState<string>("default");
    const [coverLetter, setCoverLetter] = useState("");

    // Fetch resume versions on load
    useEffect(() => {
        if (open) {
            loadResumeVersions();
            if (application) {
                setCompany(application.company_name);
                setPosition(application.position);
                setJobUrl(application.job_url || "");
                setStatus(application.status);
                // content format 2023-01-01
                setDate(application.applied_at ? new Date(application.applied_at).toISOString().split('T')[0] : "");
                setResumeVersionId(application.resume_version_id || "default");
                setCoverLetter(application.cover_letter || "");
            } else {
                clearForm();
            }
        }
    }, [open, application]);

    const loadResumeVersions = async () => {
        const result = await fetchTailoredVersions();
        if (result.data) {
            setResumeVersions(result.data);
        }
    };

    const clearForm = () => {
        setCompany("");
        setPosition("");
        setJobUrl("");
        setStatus("applied");
        setDate(new Date().toISOString().split('T')[0]);
        setResumeVersionId("default");
        setCoverLetter("");
    };

    // Helper to get resume content for AI
    const getSelectedResumeContent = () => {
        if (resumeVersionId === "default") {
            // If default, maybe we should fetch the main profile? 
            // For now return empty string, triggering the warning in CoverLetterSection 
            // OR fetch the default profile if possible. 
            // Let's rely on the user having at least one tailored version or we might need to fetch default profile.
            // As a fallback, I'll return a placeholder string or try to handle "default" if I have context.
            // Given the scope, I will just return empty if "default" is selected (unless I fetch profile).
            return "";
        }
        const version = resumeVersions.find(v => v.id === resumeVersionId);
        if (!version) return "";

        return `
            SUMMARY: ${version.tailoredSummary}
            EXPERIENCE: ${JSON.stringify(version.tailoredExperience)}
            COMPETENCIES: ${JSON.stringify(version.tailoredCompetencies)}
        `;
    };

    const handleSave = async () => {
        if (!company || !position) {
            // simple validation
            alert("Company and Position are required.");
            // toast.error("Company and Position are required");
            return;
        }

        setLoading(true);
        try {
            const data: any = {
                company_name: company,
                position: position,
                job_url: jobUrl,
                status: status as any,
                applied_at: date ? new Date(date).toISOString() : new Date().toISOString(),
                resume_version_id: resumeVersionId === "default" ? null : resumeVersionId,
                cover_letter: coverLetter
            };

            if (application) {
                await updateApplication(application.id, data);
            } else {
                await createApplication(data);
            }
            onSuccess();
            onOpenChange(false);
        } catch (e: any) {
            console.error(e);
            // toast.error("Failed to save application");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background shadow-lg">
                <DialogHeader>
                    <DialogTitle>{application ? "Edit Application" : "Track New Application"}</DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    {/* Section 1: Job Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Details</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-xs font-medium text-muted-foreground">Company Name</Label>
                                <Input
                                    id="company"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="e.g. Google"
                                    className="h-10 bg-muted/30 focus:bg-background transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position" className="text-xs font-medium text-muted-foreground">Position Title</Label>
                                <Input
                                    id="position"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="e.g. Senior Software Engineer"
                                    className="h-10 bg-muted/30 focus:bg-background transition-colors"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="jobUrl" className="text-xs font-medium text-muted-foreground">Job Posting URL</Label>
                                <Input
                                    id="jobUrl"
                                    value={jobUrl}
                                    onChange={(e) => setJobUrl(e.target.value)}
                                    placeholder="https://linkedin.com/jobs/..."
                                    className="h-10 bg-muted/30 focus:bg-background transition-colors font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Application Tracker */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracking</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">Current Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="h-10 bg-muted/30 focus:bg-background transition-colors">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="applied">Applied</SelectItem>
                                        <SelectItem value="interviewing">Interviewing</SelectItem>
                                        <SelectItem value="offer">Offer</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-medium text-muted-foreground">Date Applied</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-10 bg-muted/30 focus:bg-background transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="resumeVersion" className="text-xs font-medium text-muted-foreground">Resume Version</Label>
                                <Select value={resumeVersionId} onValueChange={setResumeVersionId}>
                                    <SelectTrigger className="h-10 bg-muted/30 focus:bg-background transition-colors truncate">
                                        <SelectValue placeholder="Select version" />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[300px]">
                                        <SelectItem value="default">Default Profile</SelectItem>
                                        {resumeVersions.map((v) => (
                                            <SelectItem key={v.id} value={v.id || "unknown"}>
                                                <span className="font-medium">{v.versionName}</span>
                                                <span className="text-xs text-muted-foreground ml-2">({v.companyName})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Cover Letter */}
                    <div className="pt-2">
                        <CoverLetterSection
                            initialContent={coverLetter}
                            jobUrl={jobUrl}
                            resumeContent={getSelectedResumeContent()}
                            onSave={setCoverLetter}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <CircleNotch size={16} className="mr-2 animate-spin" />}
                        Save Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
