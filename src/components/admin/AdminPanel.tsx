"use client";

import { useState, useEffect } from "react";
import { getAppConfig, updateAppConfig } from "@/actions/admin";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { CircleNotch, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

export function AdminPanel() {
    const [showDonation, setShowDonation] = useState(false);
    const [donationUrl, setDonationUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true);
            const { data } = await getAppConfig();
            if (data) {
                setShowDonation(data.show_donation);
                setDonationUrl(data.donation_url || "");
            }
            setIsLoading(false);
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        const result = await updateAppConfig({
            show_donation: showDonation,
            donation_url: donationUrl,
        });
        if (result.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setMessage({ type: "success", text: "Settings saved." });
            setTimeout(() => setMessage(null), 3000);
        }
        setIsSaving(false);
    };

    return (
        <PageLayout
            header={
                <PageHeader
                    title="Admin"
                    actions={
                        <Link href="/">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft size={14} />
                                Back
                            </Button>
                        </Link>
                    }
                />
            }
        >
            {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <div className="w-5 h-5 border border-border border-t-foreground rounded-full animate-spin" />
                    <p className="text-sm">Loading config...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-muted text-foreground" : "bg-destructive/5 text-destructive"}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Donation Settings */}
                    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-[var(--shadow-sm)]">
                        <h3 className="text-sm font-semibold mb-4">Donation Settings</h3>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={showDonation}
                                    onClick={() => setShowDonation(!showDonation)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${showDonation ? "bg-green-600" : "bg-muted-foreground/30"}`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${showDonation ? "translate-x-[18px]" : "translate-x-[3px]"}`}
                                    />
                                </button>
                                <span className="text-sm">Show donation button</span>
                            </label>

                            <div className="space-y-1.5">
                                <label htmlFor="donation-url" className="text-xs text-muted-foreground">
                                    Donation URL (Ko-fi, Buy Me a Coffee, etc.)
                                </label>
                                <Input
                                    id="donation-url"
                                    type="url"
                                    placeholder="https://ko-fi.com/yourname"
                                    value={donationUrl}
                                    onChange={(e) => setDonationUrl(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <CircleNotch size={16} className="animate-spin" />
                        ) : (
                            <Check size={16} weight="bold" />
                        )}
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </div>
            )}
        </PageLayout>
    );
}
