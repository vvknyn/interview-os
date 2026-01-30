"use client";

import React from "react";
import { ResumeData, ResumeSection, detectProfessionType, getSectionOrder } from "@/types/resume";
import { Pencil } from "@phosphor-icons/react";
import { useState, useMemo } from "react";

interface LiveResumePreviewProps {
    data: ResumeData;
    onEdit: (field: string) => void;
    selectedSection: string | null;
}

export function LiveResumePreview({ data, onEdit, selectedSection }: LiveResumePreviewProps) {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    // Determine section order based on experience and profession
    const sectionOrder = useMemo(() => {
        const professionType = detectProfessionType(data.profile.profession || '');
        return getSectionOrder(data.profile.yearsOfExperience || 0, professionType);
    }, [data.profile.profession, data.profile.yearsOfExperience]);

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
                className={`relative group cursor-pointer transition-all rounded ${className} ${isSelected ? 'ring-1 ring-blue-500' : ''
                    } ${isHovered ? 'bg-blue-50/30' : ''}`}
                onMouseEnter={() => setHoveredSection(id)}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => onEdit(id)}
            >
                {children}
                {(isHovered || isSelected) && (
                    <button
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white rounded-full p-1 hover:scale-110 shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(id);
                        }}
                    >
                        <Pencil size={10} weight="bold" />
                    </button>
                )}
            </div>
        );
    };

    // Render individual sections
    const renderSummary = () => (
        data.generatedSummary ? (
            <SectionWrapper id="summary" className="mb-2">
                <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-1 tracking-wide">
                    PROFESSIONAL SUMMARY
                </h2>
                <p className="text-[9.5px] leading-[1.3] text-justify">
                    {data.generatedSummary}
                </p>
            </SectionWrapper>
        ) : (
            <SectionWrapper id="summary" className="mb-2">
                <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-1 tracking-wide">
                    PROFESSIONAL SUMMARY
                </h2>
                <p className="text-gray-400 italic text-[9px] text-center py-1">
                    Click to add summary
                </p>
            </SectionWrapper>
        )
    );

    const renderSkills = () => (
        <SectionWrapper id="skills" className="mb-2">
            <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-1 tracking-wide">
                CORE COMPETENCIES
            </h2>
            {data.competencies && data.competencies.length > 0 ? (
                <ul className="space-y-0.5 text-[9.5px]">
                    {data.competencies.map((category, index) => (
                        <li key={index} className="flex leading-[1.35]">
                            <span className="mr-1">•</span>
                            <span>
                                <span className="font-bold underline">{category.category}:</span>{" "}
                                {category.skills.join(", ")}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400 italic text-[9px] text-center py-1">
                    Click to add competencies
                </p>
            )}
        </SectionWrapper>
    );

    const renderExperience = () => (
        <SectionWrapper id="experience" className="mb-2">
            <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-1 tracking-wide">
                PROFESSIONAL EXPERIENCE
            </h2>
            {data.experience && data.experience.length > 0 ? (
                <div className="space-y-2">
                    {data.experience.map((exp, index) => (
                        <div key={exp.id || index}>
                            <div className="flex justify-between items-baseline">
                                <div className="text-[9.5px]">
                                    <span className="font-bold underline">{exp.role || "Job Title"}</span>
                                    <span className="mx-1">|</span>
                                    <span>{exp.company || "Company"}</span>
                                </div>
                                <span className="text-[9px] italic whitespace-nowrap ml-2">
                                    {exp.dates || "Dates"}
                                </span>
                            </div>
                            {exp.description && (
                                <ul className="text-[9.5px] mt-0.5 space-y-0">
                                    {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                                        <li key={i} className="flex leading-[1.35]">
                                            <span className="mr-1">•</span>
                                            <span className="text-justify">{line.replace(/^[•\-]\s*/, '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 italic text-[9px] text-center py-1">
                    Click to add experience
                </p>
            )}
        </SectionWrapper>
    );

    const renderEducation = () => (
        <SectionWrapper id="education" className="mb-2">
            <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-1 tracking-wide">
                EDUCATION & PROFESSIONAL DEVELOPMENT
            </h2>
            {data.education && data.education.length > 0 ? (
                <div className="space-y-0.5 text-[9.5px]">
                    {data.education.map((edu, index) => (
                        <div key={edu.id || index} className="leading-[1.35]">
                            <span className="font-bold">{edu.degree}</span>
                            {edu.institution && <span> | {edu.institution}</span>}
                            {edu.year && <span className="italic"> ({edu.year})</span>}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 italic text-[9px] text-center py-1">
                    Click to add education
                </p>
            )}
        </SectionWrapper>
    );

    const sectionComponents: Record<ResumeSection, () => React.ReactNode> = {
        summary: renderSummary,
        skills: renderSkills,
        experience: renderExperience,
        education: renderEducation,
        projects: () => <></>, // Placeholder for future
    };

    return (
        <div className="bg-white shadow-lg rounded overflow-hidden max-w-[8.5in] mx-auto">
            {/* Resume Document - Tight spacing for maximum content */}
            <div
                className="px-6 py-4 min-h-[11in] text-gray-900"
                style={{ fontFamily: 'Times New Roman, Georgia, serif', fontSize: '10px' }}
            >
                {/* Header - Compact */}
                <SectionWrapper id="header" className="text-center pb-1.5 mb-2 border-b border-gray-400">
                    <h1 className="text-[18px] font-bold mb-0.5 tracking-wide">
                        {data.profile.profession || "Your Name"}
                    </h1>
                    <div className="text-[9.5px] text-gray-700">
                        {[
                            data.profile.location,
                            data.profile.phone,
                            data.profile.email,
                            data.profile.linkedin
                        ].filter(Boolean).join(" | ") || (
                            <span className="text-gray-400 italic">Click to add contact info</span>
                        )}
                    </div>
                </SectionWrapper>

                {/* Dynamic Section Rendering */}
                {sectionOrder.map((section) => (
                    <div key={section}>
                        {sectionComponents[section]()}
                    </div>
                ))}
            </div>
        </div>
    );
}
