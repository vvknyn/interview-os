"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarStory } from "@/types";
import { StoryManager } from "@/components/dashboard/StoryManager";
import { saveStories, fetchStories } from "@/actions/save-story";
import { FilePdf, ArrowLeft, FloppyDisk } from "@phosphor-icons/react";
import Link from "next/link";

const INITIAL_RESUME = `
1. TELUS HEALTH: Technical Account Manager. Managed $1.7M ARR portfolio. Led critical API transition for 950k users (Zero Defect Launch). Skills: Enterprise Risk, Stakeholder Management, API Migration.
2. ZOPHOP: Team Lead. Increased GPS availability by 35%. Debugged hardware firmware/battery issues in field. Skills: Hardware/IoT, Field Ops, Debugging.
3. TRACXN: Senior Engineer. Overhauled API workflows slashing feature release time. Optimized data pipelines. Skills: Data Engineering, API Design, Startups.
4. OPTYM: Senior Software Engineer. Reduced client onboarding time by 80% via ETL automation. Skills: Logistics, Optimization, SQL.
`;

export function SettingsContainer() {
    const [resume, setResume] = useState(INITIAL_RESUME);
    const [stories, setStories] = useState<StarStory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'resume' | 'stories'>('stories');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch Stories from DB
                const { data, error } = await fetchStories();
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed)) {
                            setStories(parsed);
                        }
                    } catch (e) {
                        console.warn("Legacy story format found, starting fresh.");
                    }
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Persist Stories to Supabase
            if (stories) {
                const res = await saveStories(stories);
                if (res.error) {
                    throw new Error(res.error);
                }
            }
            setMessage({ type: 'success', text: 'Settings saved successfully.' });
            setTimeout(() => setMessage(null), 3000);

        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || "Failed to save settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            alert("PDF extraction would happen here via API. Please paste text for now.");
        } else {
            const text = await file.text();
            setResume(text);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-20 shadow-sm flex-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-slate-500 hover:text-indigo-600 transition-colors">
                            <ArrowLeft size={20} weight="bold" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-800">Settings & Data</h1>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all gap-2"
                    >
                        {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <FloppyDisk size={18} weight="fill" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8 flex flex-col md:flex-row gap-8 items-start">

                {/* Left Sidebar Navigation */}
                <aside className="w-full md:w-64 flex-none sticky top-24 space-y-2">
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'resume' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent'}`}
                    >
                        Resume Context
                    </button>
                    <button
                        onClick={() => setActiveTab('stories')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'stories' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent'}`}
                    >
                        STAR Stories Library
                    </button>
                </aside>

                {/* Right Content Area */}
                <section className="flex-1 min-w-0 w-full md:max-w-4xl">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'} animate-in slide-in-from-top-2`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'resume' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Resume Context</h2>
                                    <p className="text-sm text-slate-500">This data is used to tailor interview answers to your background.</p>
                                </div>
                                <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1">
                                    <FilePdf size={14} /> Upload PDF / Text
                                    <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={handleFileUpload} />
                                </label>
                            </div>
                            <div className="p-6">
                                <Textarea
                                    value={resume}
                                    onChange={(e) => setResume(e.target.value)}
                                    className="w-full h-[500px] p-4 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all resize-y"
                                    placeholder="Paste your resume here..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'stories' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-900">STAR Stories Library</h2>
                                <p className="text-sm text-slate-500">Add detailed stories here. The AI will search these to answer behavioral questions.</p>
                            </div>
                            <div className="p-6">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                        Loading stories...
                                    </div>
                                ) : (
                                    <StoryManager stories={stories} onChange={setStories} />
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
