import { useState, useEffect } from "react";
import { TailoredResumeVersion } from "@/types/resume";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchTailoredVersions, deleteTailoredVersion } from "@/actions/tailor-resume";
import { FileText, Trash2, Calendar, Target, Loader2, X, Eye, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function TailoredVersionsList() {
    const [versions, setVersions] = useState<TailoredResumeVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [viewVersion, setViewVersion] = useState<TailoredResumeVersion | null>(null);

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
        // Optimistic delete
        setVersions(prev => prev.filter(v => v.id !== versionId));
        setDeleteConfirm(null);

        const result = await deleteTailoredVersion(versionId);
        if (result.error) {
            // Revert if error
            loadVersions();
            alert("Failed to delete version");
        } else {
            // Notify other components
            window.dispatchEvent(new Event('version-updated'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (versions.length === 0) {
        return (
            <div className="text-center py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-muted-foreground/50" />
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
                    className="border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200"
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
                                {deleteConfirm === version.id ? (
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
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setViewVersion(version);
                                            }}
                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7"
                                            title="View Changes"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
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
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
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
                                className="w-full text-xs h-8 gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                            >
                                <Target className="w-3.5 h-3.5" />
                                Prepare Interview
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}

            <Sheet open={!!viewVersion} onOpenChange={(open) => !open && setViewVersion(null)}>
                <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0">
                    <div className="px-6 py-4 border-b">
                        <SheetHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs font-normal">
                                    {viewVersion?.updatedAt ? new Date(viewVersion.updatedAt).toLocaleDateString() : 'Draft'}
                                </Badge>
                                {(viewVersion?.recommendations?.length || 0) > 0 && (
                                    <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                        {viewVersion?.recommendations?.length} Changes
                                    </Badge>
                                )}
                            </div>
                            <SheetTitle>{viewVersion?.versionName}</SheetTitle>
                            <SheetDescription>
                                Tailored for {viewVersion?.positionTitle} at {viewVersion?.companyName}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <ScrollArea className="flex-1 bg-muted/10">
                        <div className="p-6 space-y-6">
                            {viewVersion?.recommendations && viewVersion.recommendations.length > 0 ? (
                                viewVersion.recommendations.map((rec, i) => (
                                    <div key={i} className="bg-white dark:bg-neutral-900 border rounded-lg overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-background capitalize text-[10px] px-1.5 h-5">
                                                    {rec.category}
                                                </Badge>
                                                <span className="text-xs font-medium text-foreground/80">
                                                    {rec.priority === 'high' && <span className="text-orange-500 mr-1.5">●</span>}
                                                    {rec.priority === 'medium' && <span className="text-yellow-500 mr-1.5">●</span>}
                                                    {rec.priority === 'low' && <span className="text-blue-500 mr-1.5">●</span>}
                                                    Priority
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-semibold mb-1">{rec.title}</h4>
                                                <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                                            </div>

                                            {rec.original && (
                                                <div className="space-y-1.5">
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Original</div>
                                                    <div className="text-sm p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-md text-foreground/80 leading-relaxed font-mono">
                                                        {rec.original}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                    Tailored Version
                                                </div>
                                                <div className="text-sm p-3 bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 rounded-md text-foreground leading-relaxed font-mono">
                                                    {rec.suggested}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No specific changes recorded for this version.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}
