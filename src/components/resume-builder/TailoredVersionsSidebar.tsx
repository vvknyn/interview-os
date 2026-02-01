"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TailoredResumeVersion } from "@/types/resume";
import { fetchTailoredVersions, deleteTailoredVersion } from "@/actions/tailor-resume";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    Trash,
    Calendar,
    Target,
    CaretRight,
    X,
    Eye,
    Buildings,
    Sparkle
} from "@phosphor-icons/react";

interface TailoredVersionsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TailoredVersionsSidebar({ isOpen, onClose }: TailoredVersionsSidebarProps) {
    const [versions, setVersions] = useState<TailoredResumeVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadVersions = async () => {
        setIsLoading(true);
        const result = await fetchTailoredVersions();
        if (result.data) {
            setVersions(result.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadVersions();
        }

        // Listen for updates
        const handleUpdate = () => {
            if (isOpen) loadVersions();
        };

        window.addEventListener('version-updated', handleUpdate);
        return () => window.removeEventListener('version-updated', handleUpdate);
    }, [isOpen]);

    const handleDelete = async (versionId: string) => {
        // Optimistic delete
        setVersions(prev => prev.filter(v => v.id !== versionId));
        setDeleteConfirm(null);

        const result = await deleteTailoredVersion(versionId);
        if (result.error) {
            // Revert if error
            loadVersions();
        } else {
            // Notify other components
            window.dispatchEvent(new Event('version-updated'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-neutral-950 border-l border-border shadow-xl z-40 flex flex-col animate-in slide-in-from-right-full duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkle size={16} weight="fill" className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Tailored Versions</h3>
                        <p className="text-xs text-muted-foreground">{versions.length} saved</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X size={16} weight="bold" />
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                                <FileText size={28} weight="duotone" className="text-muted-foreground/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">No tailored versions yet</p>
                                <p className="text-xs text-muted-foreground">
                                    Create tailored versions from the Resume Tailor
                                </p>
                            </div>
                            <Link href="/resume-tailor">
                                <Button variant="outline" size="sm" className="mt-2">
                                    <Sparkle size={14} weight="fill" className="mr-1.5" />
                                    Go to Tailor
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        versions.map((version) => (
                            <div
                                key={version.id}
                                className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-sm truncate text-foreground">
                                            {version.versionName}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                            <Buildings size={12} weight="bold" />
                                            <span className="truncate">{version.companyName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {deleteConfirm === version.id ? (
                                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-6 px-2 text-[10px]"
                                                    onClick={() => version.id && handleDelete(version.id)}
                                                >
                                                    Confirm
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => setDeleteConfirm(null)}
                                                >
                                                    <X size={12} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => version.id && setDeleteConfirm(version.id)}
                                            >
                                                <Trash size={12} />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                        {version.positionTitle}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                        {version.recommendations?.length || 0} changes
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Calendar size={10} />
                                        {version.createdAt && new Date(version.createdAt).toLocaleDateString()}
                                    </div>
                                    <Link
                                        href={`/dashboard?company=${encodeURIComponent(version.companyName)}&position=${encodeURIComponent(version.positionTitle)}&round=Technical&searched=true&resumeVersion=${version.id}`}
                                    >
                                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1">
                                            <Target size={10} />
                                            Prepare
                                            <CaretRight size={10} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            {versions.length > 0 && (
                <div className="p-4 border-t border-border">
                    <Link href="/resume-tailor" className="block">
                        <Button variant="outline" className="w-full" size="sm">
                            <Sparkle size={14} weight="fill" className="mr-1.5" />
                            Create New Version
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}

interface TailoredVersionsToggleProps {
    isOpen: boolean;
    onToggle: () => void;
    count: number;
}

/**
 * Toggle button for the sidebar
 */
export function TailoredVersionsToggle({ isOpen, onToggle, count }: TailoredVersionsToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`group inline-flex items-center h-9 px-2.5 rounded-md border transition-all duration-200 ${isOpen
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
        >
            <Sparkle size={16} weight="fill" className={isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} />
            <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-200">
                <span className="overflow-hidden whitespace-nowrap text-sm font-medium pl-1.5">
                    Versions
                </span>
            </span>
            {count > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </button>
    );
}
