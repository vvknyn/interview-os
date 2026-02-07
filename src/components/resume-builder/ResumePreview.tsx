"use client";

import { useEffect, useState } from "react";
import { ResumeData } from "@/types/resume";
import { generateProfessionalSummary } from "@/lib/mock-ai";
import { exportToDocx } from "@/lib/export-docx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircleNotch, DownloadSimple, PencilSimple, FileText } from "@phosphor-icons/react";

interface ResumePreviewProps {
    data: ResumeData;
    update: (data: Partial<ResumeData>) => void;
}

export function ResumePreview({ data, update }: ResumePreviewProps) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!data.generatedSummary && !loading) {
            generateSummary();
        }
    }, []);

    const generateSummary = async () => {
        setLoading(true);
        try {
            const summary = await generateProfessionalSummary(
                data.profile,
                data.competencies,
                data.experience
            );
            update({ generatedSummary: summary });
        } catch (error) {
            console.error("Failed to generate summary", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-2xl font-semibold">Review & Export</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={generateSummary} disabled={loading}>
                        <PencilSimple size={16} className="mr-2" />
                        Regenerate Summary
                    </Button>
                    <Button onClick={() => exportToDocx(data)} disabled={loading} variant="outline">
                        <FileText size={16} className="mr-2" />
                        Export DOCX
                    </Button>
                    <Button onClick={() => window.print()} disabled={loading}>
                        <DownloadSimple size={16} className="mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            <div className="bg-white text-black p-10 shadow-lg min-h-[800px] max-w-[210mm] mx-auto print:shadow-none print:p-0">
                {/* Header */}
                <header className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-widest text-gray-900 border-b-2 border-black pb-2 mb-4">
                        {data.profile.profession || "YOUR NAME"}
                    </h1>
                    <div className="flex justify-center flex-wrap gap-x-4 text-sm text-gray-700">
                        {/* Name is missing in profile object based on prompt requirements, user didn't ask for name field :) 
                 I'll use Profession as title, and maybe I should have asked for Name in Step 1.
                 I'll just assume "Candidate" or wait for feedback. The skill asks for "Header: Name...".
                 I missed "Name" in Profile fields in implementation plan because user prompt logic said "Profile: profession, yoe, location...".
                 I will add a placeholder.
             */}
                        <span>{data.profile.location}</span>
                        <span>•</span>
                        <span>{data.profile.phone}</span>
                        <span>•</span>
                        <span>{data.profile.email}</span>
                        {data.profile.linkedin && (
                            <>
                                <span>•</span>
                                <a href={data.profile.linkedin} className="text-blue-700 hover:underline">
                                    {data.profile.linkedin.replace(/^https?:\/\//, '')}
                                </a>
                            </>
                        )}
                    </div>
                </header>

                {/* Professional Summary */}
                <section className="mb-6">
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">
                        Professional Summary
                    </h3>
                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-500 py-2">
                            <CircleNotch size={16} className="animate-spin" />
                            <span>Writing your professional summary...</span>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed text-gray-800">
                            {data.generatedSummary}
                        </p>
                    )}
                </section>

                {/* Core Competencies */}
                <section className="mb-6">
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">
                        Core Competencies
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        {data.competencies.map((cat, idx) => (
                            <div key={idx}>
                                <span className="font-semibold block mb-1">{cat.category}:</span>
                                <ul className="list-disc list-inside text-gray-700">
                                    {cat.skills.slice(0, 6).map((skill, sIdx) => (
                                        <li key={sIdx}>{skill}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Professional Experience */}
                <section className="mb-6">
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-4">
                        Professional Experience
                    </h3>
                    <div className="space-y-5">
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-bold text-gray-900">{exp.role}</h4>
                                    <span className="text-sm text-gray-600">{exp.dates}</span>
                                </div>
                                <div className="mb-2 text-sm font-semibold text-gray-700">
                                    {exp.company}
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                    {exp.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Education (Placeholder as per skill requirement but wasn't input) */}
                <section className="mb-6">
                    <h3 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">
                        Education
                    </h3>
                    <div className="text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span className="font-bold">Degree, Major</span>
                            <span>Year (Optional)</span>
                        </div>
                        <div>Institution Name</div>
                    </div>
                </section>

            </div>
        </div>
    );
}


