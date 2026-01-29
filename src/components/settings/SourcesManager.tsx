"use client";

import { useState, useRef, ChangeEvent } from "react";
import { SourceItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash, Plus, Link as LinkIcon, FileText, Note, Spinner } from "@phosphor-icons/react";
import { saveSource, deleteSource, fetchUrlContent } from "@/actions/sources";

interface SourcesManagerProps {
    sources: SourceItem[];
    onChange: (sources: SourceItem[]) => void;
}

export function SourcesManager({ sources, onChange }: SourcesManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [addType, setAddType] = useState<'text' | 'url' | 'file'>('text');

    // Form states
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setTitle("");
        setContent("");
        setUrl("");
        setError(null);
        setIsLoading(false);
        setIsAdding(false);
    };

    const handleAddSource = async () => {
        if (!title.trim() && addType !== 'file') {
            setError("Title is required");
            return;
        }
        if (!content.trim()) {
            setError("Content is required");
            return;
        }

        setIsLoading(true);
        setError(null);

        // TEMPORARY: Database save failing due to schema cache issue.
        // User requested to just show links in list for now.
        /*
        try {
            const res = await saveSource({
                type: addType,
                title,
                content
            });

            if (res.error) throw new Error(res.error);
            if (res.data) {
                onChange([res.data, ...sources]);
                resetForm();
            }
        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || "Failed to save source");
        }
        */

        // Local Update Only
        const tempId = crypto.randomUUID();
        const newSource: SourceItem = {
            id: tempId,
            type: addType,
            title,
            content,
            created_at: new Date().toISOString()
        };
        onChange([newSource, ...sources]);
        resetForm();
        setIsLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this source?")) return;

        try {
            await deleteSource(id);
            onChange(sources.filter(s => s.id !== id));
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const handleFetchUrl = async () => {
        if (!url) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchUrlContent(url);
            if (res.error) throw new Error(res.error);

            if (res.text) {
                setContent(res.text);
                if (res.title && !title) setTitle(res.title);
            }
        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || "Failed to fetch URL");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        try {
            const extractedText = await file.text();

            if (!extractedText.trim()) throw new Error("No text found in file");

            // Auto-save for file upload to simplify flow
            const res = await saveSource({
                type: 'file',
                title: file.name,
                content: extractedText
            });

            if (res.error) throw new Error(res.error);
            if (res.data) {
                onChange([res.data, ...sources]);
                resetForm();
            }

        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || "Failed to process file");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Knowledge Sources</h2>
                <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className={isAdding ? 'hidden' : ''}>
                    <Plus className="mr-2" /> Add Source
                </Button>
            </div>

            {isAdding && (
                <div className="border border-border rounded-lg p-4 bg-muted/30 animate-in slide-in-from-top-2">
                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={addType === 'text' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setAddType('text')}
                        >
                            <Note className="mr-2" /> Text
                        </Button>
                        <Button
                            variant={addType === 'url' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setAddType('url')}
                        >
                            <LinkIcon className="mr-2" /> URL
                        </Button>
                        <Button
                            variant={addType === 'file' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setAddType('file')}
                        >
                            <FileText className="mr-2" /> File
                        </Button>
                    </div>

                    {error && (
                        <div className="text-destructive text-sm mb-4 bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {addType === 'file' ? (
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept=".txt,.md"
                                    onChange={handleFileUpload}
                                />
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Spinner className="animate-spin h-6 w-6" />
                                        <p className="text-sm text-muted-foreground">Processing file...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-sm font-medium">Click to upload text file</p>
                                        <p className="text-xs text-muted-foreground">Extracted text will be added as a source</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {addType === 'url' && (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://example.com/article"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                        />
                                        <Button onClick={handleFetchUrl} disabled={isLoading || !url} variant="secondary">
                                            {isLoading ? <Spinner className="animate-spin" /> : "Fetch"}
                                        </Button>
                                    </div>
                                )}

                                <Input
                                    placeholder="Title (e.g., Project X Details)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />

                                <Textarea
                                    placeholder="Paste content here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                />

                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                                    <Button onClick={handleAddSource} disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save Source"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((source) => (
                    <div key={source.id} className="group border border-border rounded-lg p-4 hover:border-foreground transition-colors relative bg-card">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {source.type === 'url' && <LinkIcon className="text-blue-400" />}
                                {source.type === 'file' && <FileText className="text-orange-400" />}
                                {source.type === 'text' && <Note className="text-green-400" />}
                                <h3 className="font-medium truncate max-w-[200px]" title={source.title}>{source.title}</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleDelete(source.id, e)}
                            >
                                <Trash size={14} />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/30 p-2 rounded">
                            {source.content}
                        </p>
                        <div className="mt-2 text-[10px] text-muted-foreground flex justify-end">
                            {source.created_at ? new Date(source.created_at).toLocaleDateString() : 'Just now'}
                        </div>
                    </div>
                ))}

                {sources.length === 0 && !isAdding && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                        <p>No sources added yet.</p>
                        <p className="text-sm">Add documents, URLs, or notes to give more context to the AI.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
