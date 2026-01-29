"use client";

import { ResumeData } from "@/types/resume";
import { Pencil } from "@phosphor-icons/react";
import { useState } from "react";

interface LiveResumePreviewProps {
    data: ResumeData;
    onEdit: (field: string) => void;
    selectedSection: string | null;
}

export function LiveResumePreview({ data, onEdit, selectedSection }: LiveResumePreviewProps) {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    const SectionWrapper = ({
        id,
        children,
        className = ""
    }: {
        id: string;
        children: React.ReactNode;
        className?: string;
    }) => {
        const isSelected = selectedSection === id;
        const isHovered = hoveredSection === id;

        return (
            <div
                className={`relative group transition-all ${className} ${isSelected ? 'ring-2 ring-foreground ring-offset-2' : ''
                    } ${isHovered ? 'bg-muted/30' : ''}`}
                onMouseEnter={() => setHoveredSection(id)}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => onEdit(id)}
            >
                {children}
                {(isHovered || isSelected) && (
                    <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background rounded-full p-1.5 hover:scale-110"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(id);
                        }}
                    >
                        <Pencil size={14} weight="bold" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-[8.5in] mx-auto">
            {/* Resume Document */}
            <div className="p-12 space-y-6 min-h-[11in]">
                {/* Header Section */}
                <SectionWrapper id="header" className="border-b border-gray-200 pb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {data.profile.profession || "Click to add your name"}
                    </h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        {data.profile.email && (
                            <span>{data.profile.email}</span>
                        )}
                        {data.profile.phone && (
                            <span>{data.profile.phone}</span>
                        )}
                        {data.profile.location && (
                            <span>{data.profile.location}</span>
                        )}
                        {data.profile.linkedin && (
                            <span className="text-blue-600">{data.profile.linkedin}</span>
                        )}
                        {!data.profile.email && !data.profile.phone && !data.profile.location && (
                            <span className="text-gray-400 italic">Click to add contact information</span>
                        )}
                    </div>
                </SectionWrapper>

                {/* Professional Summary */}
                <SectionWrapper id="summary" className="py-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                        Professional Summary
                    </h2>
                    {data.generatedSummary ? (
                        <p className="text-gray-700 leading-relaxed">
                            {data.generatedSummary}
                        </p>
                    ) : (
                        <p className="text-gray-400 italic">
                            Click to add a professional summary. We'll help you write it with AI.
                        </p>
                    )}
                </SectionWrapper>

                {/* Experience Section */}
                <SectionWrapper id="experience" className="py-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                        Professional Experience
                    </h2>
                    {data.experience && data.experience.length > 0 ? (
                        <div className="space-y-6">
                            {data.experience.map((exp, index) => (
                                <div key={exp.id || index} className="relative group/exp">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {exp.role || "Job Title"}
                                            </h3>
                                            <p className="text-gray-600">
                                                {exp.company || "Company Name"}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {exp.dates || "Dates"}
                                        </span>
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-700 text-sm space-y-1 mt-2">
                                            {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                                                <div key={i} className="flex">
                                                    <span className="mr-2">•</span>
                                                    <span>{line.replace(/^[•\-]\s*/, '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">
                            Click to add your work experience
                        </p>
                    )}
                </SectionWrapper>

                {/* Skills Section */}
                {data.competencies && data.competencies.length > 0 && (
                    <SectionWrapper id="skills" className="py-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                            Skills & Competencies
                        </h2>
                        <div className="space-y-3">
                            {data.competencies.map((category, index) => (
                                <div key={index}>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        {category.category}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {category.skills.map((skill, skillIndex) => (
                                            <span
                                                key={skillIndex}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionWrapper>
                )}
            </div>
        </div>
    );
}
