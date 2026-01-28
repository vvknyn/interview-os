
import { useState, useEffect } from "react";
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

export const PROVIDERS = [
    { id: 'groq', name: 'Groq (Llama 3, Mixtral)' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI (GPT-4)' },
];

export const AVAILABLE_MODELS = {
    groq: [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Recommended)" },
        { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Fast)" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
        { id: "gemma2-9b-it", name: "Gemma 2 9B" },
    ],
    gemini: [
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Powerful)" },
    ],
    openai: [
        { id: "gpt-4o", name: "GPT-4o" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ]
};

interface ModelSettingsProps {
    apiKey: string;
    model: string;
    onSave: (apiKey: string, model: string) => void;
    loading: boolean;
}

export function ModelSettings({ apiKey, model, onSave, loading }: ModelSettingsProps) {
    // State for all keys
    const [keys, setKeys] = useState<{ [key: string]: string }>({
        groq: "",
        gemini: "",
        openai: ""
    });

    // State for selection
    const [provider, setProvider] = useState<string>("groq");
    const [selectedModel, setSelectedModel] = useState(model || AVAILABLE_MODELS.groq[0].id);

    // Initialize state from props
    useEffect(() => {
        // Parse provider:model
        let initProvider = "groq";
        let initModel = "llama-3.3-70b-versatile";

        if (model && model.includes(':')) {
            const parts = model.split(':');
            initProvider = parts[0];
            initModel = parts.slice(1).join(':');
        } else if (model) {
            // Legacy fallback
            initModel = model;
        }

        setProvider(initProvider);
        setSelectedModel(initModel);

        // Parse API Key JSON
        try {
            if (apiKey && apiKey.trim().startsWith('{')) {
                const parsed = JSON.parse(apiKey);
                setKeys(prev => ({ ...prev, ...parsed }));
            } else if (apiKey) {
                // Legacy: assume key belongs to Groq if only one exists
                setKeys(prev => ({ ...prev, groq: apiKey }));
            }
        } catch (e) {
            console.error("Failed to parse API keys", e);
        }
    }, [apiKey, model]);

    const handleKeyChange = (p: string, value: string) => {
        setKeys(prev => ({ ...prev, [p]: value }));
    };

    const handleSave = () => {
        // Save composite key and composite model string
        const compositeKey = JSON.stringify(keys);
        const compositeModel = `${provider}:${selectedModel}`;
        onSave(compositeKey, compositeModel);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="border border-border rounded-lg p-6 bg-card/50">
                <h3 className="text-base font-semibold mb-4">LLM Provider Configuration</h3>

                <div className="grid gap-6">
                    {/* Provider Select */}
                    <div className="space-y-2">
                        <Label>Select Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select Provider" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-950">
                                {PROVIDERS.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic Model Select */}
                    <div className="space-y-2">
                        <Label>Select Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-950">
                                {/* @ts-ignore */}
                                {AVAILABLE_MODELS[provider]?.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* API Key Input for Selected Provider */}
                    <div className="space-y-2">
                        <Label>API Key for {PROVIDERS.find(p => p.id === provider)?.name}</Label>
                        <Input
                            type="password"
                            placeholder={`Enter your ${provider.toUpperCase()} API Key`}
                            value={keys[provider] || ""}
                            onChange={(e) => handleKeyChange(provider, e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Your key is stored securely in your database.
                            {provider === 'groq' && " Use specific Groq keys."}
                            {provider === 'gemini' && " Get a key from Google AI Studio."}
                            {provider === 'openai' && " Requires an OpenAI Platform key."}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
