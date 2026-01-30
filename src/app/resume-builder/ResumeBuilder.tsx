"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResumeData } from "@/types/resume";
import { ResumeEditor } from "@/components/resume-builder/ResumeEditor";
import { ArrowLeft } from "@phosphor-icons/react";
import { fetchProfile } from "@/actions/profile";
import { ProviderConfig } from "@/lib/llm/types";
import { Header } from "@/components/layout/Header";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const INITIAL_DATA: ResumeData = {
    profile: {
        profession: "",
        yearsOfExperience: 0,
        location: "",
        email: "",
        phone: "",
        linkedin: "",
    },
    experience: [],
    competencies: [],
    education: [],
    generatedSummary: "",
};

const STORAGE_KEY = "interview-os-resume-data";

export default function ResumeBuilder() {
    const [data, setData] = useState<ResumeData>(INITIAL_DATA);
    const [isLoaded, setIsLoaded] = useState(false);
    const [modelConfig, setModelConfig] = useState<Partial<ProviderConfig>>({});
    const [user, setUser] = useState<User | null>(null);

    // Load from LocalStorage
    useEffect(() => {
        const loadData = async () => {
            // Fetch User
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    setData(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse saved resume data", e);
                }
            }

            // Load model config for AI generation
            const { data: profileData } = await fetchProfile();
            if (profileData && profileData.preferred_model) {
                const config: Partial<ProviderConfig> = { model: profileData.preferred_model };
                if (profileData.preferred_model.startsWith('gemini')) config.provider = 'gemini';
                else if (profileData.preferred_model.startsWith('gpt')) config.provider = 'openai';
                else config.provider = 'groq';

                if (profileData.custom_api_key && !profileData.custom_api_key.startsWith('{')) {
                    config.apiKey = profileData.custom_api_key;
                }
                setModelConfig(config);
            } else {
                // Guest mode: Load from localStorage
                const guestKey = localStorage.getItem('guest_api_key');
                const guestModel = localStorage.getItem('guest_model');

                if (guestKey && guestModel) {
                    let provider: 'groq' | 'gemini' | 'openai' = 'groq';
                    let model = 'llama-3.3-70b-versatile';

                    if (guestModel.includes(':')) {
                        const parts = guestModel.split(':');
                        provider = parts[0] as any;
                        model = parts.slice(1).join(':');
                    }

                    let apiKey = guestKey;
                    if (guestKey.trim().startsWith('{')) {
                        try {
                            const keys = JSON.parse(guestKey);
                            apiKey = keys[provider] || "";
                        } catch (e) {
                            console.warn("Failed to parse guest API keys", e);
                        }
                    }

                    setModelConfig({ provider, model, apiKey });
                }
            }

            setIsLoaded(true);
        };
        loadData();
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }, [data, isLoaded]);

    const updateData = (partialData: Partial<ResumeData>) => {
        setData((prev) => ({ ...prev, ...partialData }));
    };

    const clearData = () => {
        if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            setData(INITIAL_DATA);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Main Header */}
            <Header
                user={user}
                showSearch={false}
                title="Resume Builder"
            />

            {/* Main Editor */}
            <ResumeEditor
                data={data}
                onUpdate={updateData}
                onClear={clearData}
                modelConfig={modelConfig}
            />
        </div>
    );
}
