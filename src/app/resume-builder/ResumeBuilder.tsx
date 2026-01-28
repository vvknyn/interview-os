"use client";

import { useState } from "react";
import { ResumeData, ResumeProfile, ResumeExperience, ResumeCompetencyCategory } from "@/types/resume";
import { ProfileForm } from "@/components/resume-builder/ProfileForm";
import { ExperienceBuilder } from "@/components/resume-builder/ExperienceBuilder";
import { SkillsEngine } from "@/components/resume-builder/SkillsEngine";
import { ResumePreview } from "@/components/resume-builder/ResumePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    generatedSummary: "",
};

export default function ResumeBuilder() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<ResumeData>(INITIAL_DATA);

    const updateData = (partialData: Partial<ResumeData>) => {
        setData((prev) => ({ ...prev, ...partialData }));
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const renderStep = () => {
        switch (step) {
            case 1:
                return <ProfileForm data={data} update={updateData} />;
            case 2:
                return <ExperienceBuilder data={data} update={updateData} />;
            case 3:
                return <SkillsEngine data={data} update={updateData} />;
            case 4:
                return <ResumePreview data={data} update={updateData} />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Resume Generator</h1>
                <div className="text-sm text-gray-500">Step {step} of 4</div>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                    className="bg-black h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            <Card className="min-h-[400px]">
                <CardContent className="p-6">
                    {renderStep()}
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1}
                >
                    Back
                </Button>
                {step < 4 && (
                    <Button onClick={nextStep}>
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}
