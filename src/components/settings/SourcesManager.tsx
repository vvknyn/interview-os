"use client";

import { useState, useRef, useCallback, ChangeEvent } from "react";
import { SourceItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Trash, Plus, Link as LinkIcon, FileText, Note, Spinner,
    Globe, EyeSlash, MagnifyingGlass, Check, CaretDown, CaretUp,
} from "@phosphor-icons/react";
import {
    saveSource, deleteSource, fetchUrlContent, discoverLinks,
    fetchPublicSources, addPublicSourceToCollection,
} from "@/actions/sources";

interface SourcesManagerProps {
    sources: SourceItem[];
    onChange: (sources: SourceItem[]) => void;
}

interface DiscoveredLink {
    url: string;
    title: string;
    selected: boolean;
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
}

export function SourcesManager({ sources, onChange }: SourcesManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [addType, setAddType] = useState<'text' | 'url' | 'file'>('text');

    // Form states
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [url, setUrl] = useState("");
    const [visibility, setVisibility] = useState<'private' | 'public'>('private');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Discovered links
    const [discoveredLinks, setDiscoveredLinks] = useState<DiscoveredLink[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [showDiscovered, setShowDiscovered] = useState(true);
    const [isFetchingSelected, setIsFetchingSelected] = useState(false);

    // Community tab
    const [communitySearch, setCommunitySearch] = useState("");
    const [communitySources, setCommunitySources] = useState<Omit<SourceItem, 'user_id'>[]>([]);
    const [communityLoading, setCommunityLoading] = useState(false);
    const [addingSourceId, setAddingSourceId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setTitle("");
        setContent("");
        setUrl("");
        setVisibility('private');
        setError(null);
        setIsLoading(false);
        setIsAdding(false);
        setDiscoveredLinks([]);
        setShowDiscovered(true);
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

        try {
            const res = await saveSource({
                type: addType,
                title,
                content,
                visibility,
            });

            if (res.error) throw new Error(res.error);
            if (res.data) {
                onChange([res.data, ...sources]);
                resetForm();
            }
        } catch (e: unknown) {
            const err = e as Error;
            setError(err.message || "Failed to save source");
        } finally {
            setIsLoading(false);
        }
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
        setDiscoveredLinks([]);

        try {
            const res = await fetchUrlContent(url);
            if (res.error) throw new Error(res.error);

            if (res.text) {
                setContent(res.text);
                if (res.title && !title) setTitle(res.title);
            }

            // Discover related links in background
            setIsDiscovering(true);
            discoverLinks(url).then(result => {
                if (result.links.length > 0) {
                    setDiscoveredLinks(result.links.map(l => ({
                        ...l,
                        selected: false,
                        status: 'idle' as const,
                    })));
                }
            }).finally(() => setIsDiscovering(false));
        } catch (e: unknown) {
            const err = e as Error;
            setError(err.message || "Failed to fetch URL");
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

            const res = await saveSource({
                type: 'file',
                title: file.name,
                content: extractedText,
                visibility,
            });

            if (res.error) throw new Error(res.error);
            if (res.data) {
                onChange([res.data, ...sources]);
                resetForm();
            }
        } catch (e: unknown) {
            const err = e as Error;
            setError(err.message || "Failed to process file");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleLinkSelection = (index: number) => {
        setDiscoveredLinks(prev => prev.map((l, i) =>
            i === index ? { ...l, selected: !l.selected } : l
        ));
    };

    const selectAllLinks = () => {
        const allSelected = discoveredLinks.every(l => l.selected);
        setDiscoveredLinks(prev => prev.map(l => ({ ...l, selected: !allSelected })));
    };

    const handleFetchSelected = async () => {
        const selected = discoveredLinks.filter(l => l.selected && l.status !== 'success');
        if (selected.length === 0) return;

        setIsFetchingSelected(true);

        for (const link of selected) {
            const idx = discoveredLinks.findIndex(l => l.url === link.url);

            // Mark loading
            setDiscoveredLinks(prev => prev.map((l, i) =>
                i === idx ? { ...l, status: 'loading' as const } : l
            ));

            try {
                const res = await fetchUrlContent(link.url);
                if (res.error) throw new Error(res.error);

                if (res.text) {
                    const saveRes = await saveSource({
                        type: 'url',
                        title: res.title || link.title,
                        content: res.text,
                        visibility,
                    });

                    if (saveRes.error) throw new Error(saveRes.error);
                    if (saveRes.data) {
                        onChange([saveRes.data, ...sources]);
                    }

                    setDiscoveredLinks(prev => prev.map((l, i) =>
                        i === idx ? { ...l, status: 'success' as const } : l
                    ));
                }
            } catch (e: unknown) {
                const err = e as Error;
                setDiscoveredLinks(prev => prev.map((l, i) =>
                    i === idx ? { ...l, status: 'error' as const, error: err.message } : l
                ));
            }
        }

        setIsFetchingSelected(false);
    };

    const loadCommunity = useCallback(async (search?: string) => {
        setCommunityLoading(true);
        try {
            const res = await fetchPublicSources(search);
            if (res.data) setCommunitySources(res.data);
        } finally {
            setCommunityLoading(false);
        }
    }, []);

    const handleAddFromCommunity = async (sourceId: string) => {
        setAddingSourceId(sourceId);
        try {
            const res = await addPublicSourceToCollection(sourceId);
            if (res.data) {
                onChange([res.data, ...sources]);
            }
        } finally {
            setAddingSourceId(null);
        }
    };

    const selectedCount = discoveredLinks.filter(l => l.selected).length;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="my-sources" onValueChange={(v) => {
                if (v === 'community') loadCommunity();
            }}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Knowledge Sources</h2>
                    <TabsList>
                        <TabsTrigger value="my-sources">My Sources</TabsTrigger>
                        <TabsTrigger value="community">Community</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="my-sources" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className={isAdding ? 'hidden' : ''}>
                            <Plus className="mr-2" /> Add Source
                        </Button>
                    </div>

                    {isAdding && (
                        <div className="border border-border rounded-lg p-4 bg-muted/30 animate-in slide-in-from-top-2">
                            <div className="flex gap-4 mb-4">
                                <Button variant={addType === 'text' ? "default" : "ghost"} size="sm" onClick={() => setAddType('text')}>
                                    <Note className="mr-2" /> Text
                                </Button>
                                <Button variant={addType === 'url' ? "default" : "ghost"} size="sm" onClick={() => setAddType('url')}>
                                    <LinkIcon className="mr-2" /> URL
                                </Button>
                                <Button variant={addType === 'file' ? "default" : "ghost"} size="sm" onClick={() => setAddType('file')}>
                                    <FileText className="mr-2" /> File
                                </Button>

                                <div className="ml-auto flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setVisibility(v => v === 'private' ? 'public' : 'private')}
                                        className="gap-2 text-xs"
                                    >
                                        {visibility === 'private' ? (
                                            <><EyeSlash size={16} /> Private</>
                                        ) : (
                                            <><Globe size={16} /> Public</>
                                        )}
                                    </Button>
                                </div>
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

                                        {/* Discovered links section */}
                                        {(isDiscovering || discoveredLinks.length > 0) && (
                                            <div className="border border-border rounded-lg p-3 bg-muted/20">
                                                <button
                                                    onClick={() => setShowDiscovered(v => !v)}
                                                    className="flex items-center gap-2 w-full text-sm font-medium text-left"
                                                >
                                                    {showDiscovered ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                                    Related pages found ({discoveredLinks.length})
                                                    {isDiscovering && <Spinner className="animate-spin" size={14} />}
                                                </button>

                                                {showDiscovered && discoveredLinks.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Button variant="ghost" size="sm" onClick={selectAllLinks} className="text-xs h-7">
                                                                {discoveredLinks.every(l => l.selected) ? 'Deselect All' : 'Select All'}
                                                            </Button>
                                                            {selectedCount > 0 && (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={handleFetchSelected}
                                                                    disabled={isFetchingSelected}
                                                                    className="text-xs h-7"
                                                                >
                                                                    {isFetchingSelected
                                                                        ? <><Spinner className="animate-spin mr-1" size={12} /> Fetching...</>
                                                                        : `Fetch Selected (${selectedCount})`
                                                                    }
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                                                            {discoveredLinks.map((link, i) => (
                                                                <label
                                                                    key={link.url}
                                                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={link.selected}
                                                                        onChange={() => toggleLinkSelection(i)}
                                                                        disabled={link.status === 'success'}
                                                                        className="rounded"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="truncate font-medium text-xs">{link.title}</p>
                                                                        <p className="truncate text-[10px] text-muted-foreground">{link.url}</p>
                                                                    </div>
                                                                    {link.status === 'loading' && <Spinner className="animate-spin shrink-0" size={14} />}
                                                                    {link.status === 'success' && <Check className="text-green-500 shrink-0" size={14} />}
                                                                    {link.status === 'error' && (
                                                                        <span className="text-destructive text-[10px] shrink-0" title={link.error}>Failed</span>
                                                                    )}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                        {source.visibility === 'public' && (
                                            <Badge variant="brand" className="text-[10px] px-1.5 py-0">Public</Badge>
                                        )}
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
                </TabsContent>

                <TabsContent value="community" className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input
                                placeholder="Search community sources..."
                                value={communitySearch}
                                onChange={(e) => setCommunitySearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') loadCommunity(communitySearch); }}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="secondary" onClick={() => loadCommunity(communitySearch)} disabled={communityLoading}>
                            {communityLoading ? <Spinner className="animate-spin" /> : "Search"}
                        </Button>
                    </div>

                    {communityLoading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Spinner className="animate-spin mr-2" /> Loading community sources...
                        </div>
                    ) : communitySources.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                            <Globe size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No public sources found.</p>
                            <p className="text-sm">Share your sources with the community by setting visibility to Public.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {communitySources.map((source) => (
                                <div key={source.id} className="border border-border rounded-lg p-4 bg-card">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {source.type === 'url' && <LinkIcon className="text-blue-400" />}
                                            {source.type === 'file' && <FileText className="text-orange-400" />}
                                            {source.type === 'text' && <Note className="text-green-400" />}
                                            <h3 className="font-medium truncate max-w-[200px]" title={source.title}>{source.title}</h3>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7 shrink-0"
                                            disabled={addingSourceId === source.id}
                                            onClick={() => handleAddFromCommunity(source.id)}
                                        >
                                            {addingSourceId === source.id ? (
                                                <Spinner className="animate-spin" size={12} />
                                            ) : (
                                                <><Plus size={12} className="mr-1" /> Add</>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/30 p-2 rounded">
                                        {source.content}
                                    </p>
                                    <div className="mt-2 text-[10px] text-muted-foreground flex justify-end">
                                        {source.created_at ? new Date(source.created_at).toLocaleDateString() : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
