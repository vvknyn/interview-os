import { useState, useEffect } from "react";
import { TailoredResumeVersion } from "@/types/resume";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchTailoredVersions, deleteTailoredVersion } from "@/actions/tailor-resume";
import { FileText, Trash, Calendar, Target, CircleNotch, X, Eye, ArrowRight, CheckCircle, SpinnerGap } from "@phosphor-icons/react";
import Link from "next/link";

export function TailoredVersionsList() {
    const [versions, setVersions] = useState<TailoredResumeVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadVersions = async () => {
        setIsLoading(true);
        const result = await fetchTailoredVersions();
        if (result.data) {
            setVersions(result.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadVersions();

        // Listen for updates
        const handleUpdate = () => {
            loadVersions();
        };

        window.addEventListener('version-updated', handleUpdate);
        return () => window.removeEventListener('version-updated', handleUpdate);
    }, []);

    const handleDelete = async (versionId: string) => {
        setDeletingId(versionId);
        setDeleteConfirm(null);

        const result = await deleteTailoredVersion(versionId);

        if (result.error) {
            console.error("[TailoredVersionsList] Delete failed:", result.error);
            alert("Failed to delete version: " + result.error);
            setDeletingId(null);
        } else {
            // Remove from local state after successful delete
            setVersions(prev => prev.filter(v => v.id !== versionId));
            setDeletingId(null);
            // Notify other components
            window.dispatchEvent(new Event('version-updated'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <CircleNotch size={20} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (versions.length === 0) {
        return (
            <div className="text-center py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                    No saved versions yet.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    Create tailored versions to see them here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {versions.map((version) => (
                <Card
                    key={version.id}
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                >
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate text-foreground">
                                    {version.versionName}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {version.companyName} • {version.positionTitle}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {deletingId === version.id ? (
                                    <div className="flex items-center justify-center h-7 w-7">
                                        <SpinnerGap size={16} className="animate-spin text-muted-foreground" />
                                    </div>
                                ) : deleteConfirm === version.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="h-7 px-2 text-xs"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                version.id && handleDelete(version.id);
                                            }}
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 text-muted-foreground"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setDeleteConfirm(null);
                                            }}
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Link href={`/resume-builder?versionId=${version.id}`} passHref>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-brand hover:bg-brand/10 h-7 w-7"
                                                title="Open in Builder"
                                            >
                                                <Eye size={14} />
                                            </Button>
                                        </Link>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                version.id && setDeleteConfirm(version.id);
                                            }}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                                            title="Delete Version"
                                        >
                                            <Trash size={14} />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar size={12} />
                                {version.createdAt && new Date(version.createdAt).toLocaleDateString()}
                            </div>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                {version.recommendations?.length || 0} changes
                            </Badge>
                        </div>

                        <Link
                            href={`/dashboard?company=${encodeURIComponent(version.companyName)}&position=${encodeURIComponent(version.positionTitle)}&round=Technical&searched=true&resumeVersion=${version.id}`}
                            className="block"
                        >
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-8 gap-2 hover:bg-brand/5 hover:border-brand/50 transition-colors"
                            >
                                <Target size={14} />
                                Prepare Interview
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
