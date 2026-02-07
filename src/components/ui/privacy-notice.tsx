"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck } from "@phosphor-icons/react";

const DISMISS_KEY = "privacy-notice-dismissed";

export function PrivacyNotice() {
    const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

    useEffect(() => {
        const wasDismissed = localStorage.getItem(DISMISS_KEY);
        if (!wasDismissed) {
            setDismissed(false);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, "true");
        setDismissed(true);
    };

    if (dismissed) return null;

    return (
        <div className="relative bg-card rounded-xl p-4 shadow-[var(--shadow-sm)] mb-6 animate-in fade-in duration-300">
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>

            <div className="flex gap-3 pr-8">
                <div className="flex-shrink-0 mt-0.5">
                    <ShieldCheck size={20} className="text-brand" />
                </div>
                <div className="space-y-1.5">
                    <p className="text-sm font-medium">Your data stays yours</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This is a bring-your-own-key tool. Your API keys are stored encrypted and used only to make
                        requests on your behalf. Your resume, stories, and interview data are sent to the AI provider
                        you choose (Groq, Gemini, or OpenAI) to generate responses. No data is shared with third
                        parties beyond the provider you select. You can export or delete all your data at any time
                        from Settings.
                    </p>
                </div>
            </div>
        </div>
    );
}
