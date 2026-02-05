"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeSlash, Link as LinkIcon, CheckCircle, WarningCircle, CircleNotch } from "@phosphor-icons/react";

interface ApiKeyConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    provider: 'groq' | 'gemini' | 'openai';
    currentKey?: string;
    onSave: (provider: 'groq' | 'gemini' | 'openai', key: string) => Promise<void>;
}

const PROVIDER_INFO = {
    groq: {
        name: "Groq",
        keyPlaceholder: "gsk_...",
        getKeyUrl: "https://console.groq.com/keys"
    },
    gemini: {
        name: "Google Gemini",
        keyPlaceholder: "AIza...",
        getKeyUrl: "https://aistudio.google.com/app/apikey"
    },
    openai: {
        name: "OpenAI",
        keyPlaceholder: "sk-...",
        getKeyUrl: "https://platform.openai.com/api-keys"
    }
};

export function ApiKeyConfigModal({ open, onOpenChange, provider, currentKey = "", onSave }: ApiKeyConfigModalProps) {
    const [apiKey, setApiKey] = useState(currentKey);
    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

    const info = PROVIDER_INFO[provider];

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setApiKey(currentKey);
            setError(null);
            setValidationStatus('idle');
        }
    }, [open, currentKey]);

    // Basic key format validation
    const isKeyFormatValid = (key: string): boolean => {
        if (!key || key.trim() === '') return false;
        const trimmedKey = key.trim();

        switch (provider) {
            case 'groq':
                return trimmedKey.startsWith('gsk_') && trimmedKey.length > 20;
            case 'gemini':
                return trimmedKey.startsWith('AIza') && trimmedKey.length > 20;
            case 'openai':
                return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
            default:
                return trimmedKey.length > 10;
        }
    };

    // Validate key format when it changes
    useEffect(() => {
        if (apiKey && apiKey.trim().length > 5) {
            if (isKeyFormatValid(apiKey)) {
                setValidationStatus('idle');
                setError(null);
            } else {
                setValidationStatus('invalid');
                setError(`This doesn't look like a valid ${info.name} API key. Expected format: ${info.keyPlaceholder}...`);
            }
        } else {
            setValidationStatus('idle');
            setError(null);
        }
    }, [apiKey, provider, info.name, info.keyPlaceholder]);

    const handleSave = async () => {
        // Quick format check
        if (!isKeyFormatValid(apiKey)) {
            setError(`Please enter a valid ${info.name} API key`);
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            console.log("[ApiKeyConfigModal] Saving key for provider:", provider);
            await onSave(provider, apiKey.trim());
            console.log("[ApiKeyConfigModal] Save successful, closing modal");
            setValidationStatus('valid');
            onOpenChange(false);
        } catch (error) {
            console.error("[ApiKeyConfigModal] Save failed:", error);
            setError(error instanceof Error ? error.message : "Failed to save API key");
            setValidationStatus('invalid');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md !bg-white border-neutral-200">
                <DialogHeader>
                    <DialogTitle>Configure {info.name} API Key</DialogTitle>
                    <DialogDescription>
                        Enter your {info.name} API key to use their models. Your key is stored securely{" "}
                        {currentKey ? "in your profile" : "locally"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <div className="relative">
                            <Input
                                id="apiKey"
                                type={showKey ? "text" : "password"}
                                placeholder={info.keyPlaceholder}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className={`pr-20 ${validationStatus === 'invalid' ? 'border-red-400 focus:border-red-500' : ''} ${validationStatus === 'valid' ? 'border-green-400 focus:border-green-500' : ''}`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {/* Validation indicator */}
                                {isValidating && (
                                    <CircleNotch size={16} className="text-muted-foreground animate-spin" />
                                )}
                                {!isValidating && validationStatus === 'valid' && (
                                    <CheckCircle size={16} weight="fill" className="text-green-500" />
                                )}
                                {!isValidating && validationStatus === 'invalid' && apiKey.length > 5 && (
                                    <WarningCircle size={16} weight="fill" className="text-red-500" />
                                )}
                                {/* Show/hide toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                                >
                                    {showKey ? (
                                        <EyeSlash size={16} className="text-muted-foreground" />
                                    ) : (
                                        <Eye size={16} className="text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {/* Format hint */}
                        {apiKey && apiKey.length > 0 && apiKey.length < 10 && (
                            <p className="text-xs text-muted-foreground">
                                Expected format: {info.keyPlaceholder}...
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LinkIcon size={14} />
                        <span>
                            Don't have a key?{" "}
                            <a
                                href={info.getKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Get one from {info.name}
                            </a>
                        </span>
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
                        disabled={!apiKey.trim() || isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Key"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
