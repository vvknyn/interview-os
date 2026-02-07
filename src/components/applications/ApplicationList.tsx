"use client";

import { Application, deleteApplication } from "@/actions/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Calendar, ArrowSquareOut, DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";
// import { toast } from "sonner"; 

interface ApplicationListProps {
    applications: Application[];
    onEdit: (app: Application) => void;
    onRefresh: () => void;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    applied: "secondary",
    interviewing: "default", // often blueish in shadcn default
    offer: "default", // verify if we have success variant, otherwise default
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

export function ApplicationList({ applications, onEdit, onRefresh }: ApplicationListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this application?")) return;
        setDeletingId(id);
        try {
            await deleteApplication(id);
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingId(null);
        }
    };

    if (applications.length === 0) {
        return (
            <div className="text-center py-12 rounded-lg opacity-50">
                <Briefcase size={48} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium">No applications tracked yet</h3>
                <p className="text-sm">Add your first job application to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {applications.map((app) => (
                <Card key={app.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
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
                                onClick={() => handleDelete(app.id)}
                                disabled={deletingId === app.id}
                            >
                                <Trash size={16} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
