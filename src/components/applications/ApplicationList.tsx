"use client";

import { Application, deleteApplication } from "@/actions/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";

interface ApplicationListProps {
    applications: Application[];
    onEdit: (app: Application) => void;
    onRefresh: () => void;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    applied: "secondary",
    interviewing: "default",
    offer: "default",
    rejected: "destructive",
    withdrawn: "outline"
};

const statusLabels: Record<string, string> = {
    applied: "Applied",
    interviewing: "Interviewing",
    offer: "Offer",
    rejected: "Rejected",
    withdrawn: "Withdrawn"
};

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function ApplicationList({ applications, onEdit, onRefresh }: ApplicationListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

    const requestDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setApplicationToDelete(id);
    };

    const confirmDelete = async () => {
        if (!applicationToDelete) return;

        const id = applicationToDelete;
        setDeletingId(id);
        setApplicationToDelete(null); // Close modal immediately

        try {
            const result = await deleteApplication(id);
            if (result.error) {
                console.error("Delete failed:", result.error);
                alert(`Failed to delete application: ${result.error}`);
            } else {
                onRefresh();
            }
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred");
        } finally {
            setDeletingId(null);
        }
    };

    if (applications.length === 0) {
        return (
            <div className="bg-card rounded-xl shadow-[var(--shadow-sm)] border border-dashed border-border">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4 text-brand">
                        <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No applications tracked yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                        Add your first job application to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4">
                {applications.map((app) => (
                    <div key={app.id} className="bg-card rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex-1 min-w-0 grid gap-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold truncate">{app.position}</h3>
                                    <Badge variant={statusColors[app.status] || "secondary"}>
                                        {statusLabels[app.status] || app.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground gap-4">
                                    <span className="flex items-center gap-1">
                                        <Briefcase size={12} />
                                        {app.company_name}
                                    </span>
                                    {app.applied_at && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(app.applied_at).toLocaleDateString()}
                                        </span>
                                    )}
                                    {app.job_url && (
                                        <a
                                            href={app.job_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-brand hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ArrowSquareOut size={12} />
                                            Job Link
                                        </a>
                                    )}
                                </div>
                                {app.resume_version?.version_name && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Resume: {app.resume_version.version_name}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(app)}>
                                    <PencilSimple size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive/90"
                                    onClick={(e) => requestDelete(app.id, e)}
                                    disabled={deletingId === app.id}
                                >
                                    <Trash size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!applicationToDelete} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this application? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplicationToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
