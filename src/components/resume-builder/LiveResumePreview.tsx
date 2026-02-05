"use client";

import React from "react";
import { ResumeData, ResumeSection, detectProfessionType, getSectionOrder } from "@/types/resume";
import { Pencil } from "@phosphor-icons/react";
import { useState, useMemo } from "react";

interface LiveResumePreviewProps {
    data: ResumeData;
    onEdit: (field: string) => void;
    selectedSection: string | null;
    originalData?: ResumeData | null; // For diff highlighting
}

export function LiveResumePreview(props: LiveResumePreviewProps) {
    const { data, onEdit, selectedSection, originalData } = props;
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    // Determine section order - use custom order if set, otherwise auto-detect
    const sectionOrder = useMemo(() => {
        // If user has set a custom order, use that
        if (data.sectionOrder && data.sectionOrder.length > 0) {
            return data.sectionOrder;
        }
        // Otherwise, auto-detect based on profession and experience
        const professionType = detectProfessionType(data.profile.profession || '');
        return getSectionOrder(data.profile.yearsOfExperience || 0, professionType);
    }, [data.sectionOrder, data.profile.profession, data.profile.yearsOfExperience]);

    // Helper to check for changes
    const getChangeStatus = (section: string, itemId?: string): 'modified' | 'new' | 'removed' | null => {
        if (!originalData) return null;

        if (section === 'summary') {
            return data.generatedSummary !== originalData.generatedSummary ? 'modified' : null;
        }

        if (section === 'skills') {
            // Compare all competencies
            const current = JSON.stringify(data.competencies);
            const original = JSON.stringify(originalData.competencies);
            return current !== original ? 'modified' : null;
        }

        if (section === 'experience' && itemId) {
            const currentExp = data.experience?.find(e => e.id === itemId);
            const originalExp = originalData.experience?.find(e => e.id === itemId);

            if (!originalExp) return 'new'; // It's a new item
            if (!currentExp) return 'removed'; // Item was removed

            // Allow ignoring whitespace/formatting differences
            const clean = (s: string) => s?.trim().replace(/\s+/g, ' ') || '';
            const hasChanged =
                clean(currentExp?.role || '') !== clean(originalExp.role || '') ||
                clean(currentExp?.company || '') !== clean(originalExp.company || '') ||
                clean(currentExp?.description || '') !== clean(originalExp.description || '');

            return hasChanged ? 'modified' : null;
        }

        return null;
    };

    // Get removed items (items in original but not in current)
    const getRemovedExperiences = () => {
        if (!originalData) return [];
        return originalData.experience?.filter(
            origExp => !data.experience?.find(e => e.id === origExp.id)
        ) || [];
    };

    const SectionWrapper = ({
        id,
        children,
        className = "",
        changeStatus = null
    }: {
        id: string;
        children: React.ReactNode;
        className?: string;
        changeStatus?: 'modified' | 'new' | 'removed' | null;
    }) => {
        const isSelected = selectedSection === id;
        const isHovered = hoveredSection === id;

        // Visual indicator styles - MORE PROMINENT
        const changeStyle = changeStatus === 'modified'
            ? 'bg-amber-100 ring-2 ring-amber-400 shadow-md dark:bg-amber-900/40 dark:ring-amber-600'
            : changeStatus === 'new'
                ? 'bg-green-100 ring-2 ring-green-400 shadow-md dark:bg-green-900/40 dark:ring-green-600'
                : changeStatus === 'removed'
                    ? 'bg-red-100 ring-2 ring-red-400 shadow-md opacity-60 dark:bg-red-900/40 dark:ring-red-600'
                    : '';

        return (
            <div
                className={`relative group cursor-pointer transition-all rounded ${className}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    ${!isSelected && changeStyle /* Only show diff highlight if not selected (selection overrides) */}
                    ${isHovered && !changeStatus ? 'bg-blue-50/30' : ''}`}
                onMouseEnter={() => setHoveredSection(id)}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => onEdit(id)}
            >
                {/* Change Indicator Badge - MORE PROMINENT */}
                {changeStatus && !isSelected && (
                    <div className={`absolute -right-1 -top-1 px-2 py-0.5 text-[9px] font-bold rounded shadow-md z-10
                        ${changeStatus === 'modified' ? 'bg-amber-500 text-white' : ''}
                        ${changeStatus === 'new' ? 'bg-green-500 text-white' : ''}
                        ${changeStatus === 'removed' ? 'bg-red-500 text-white' : ''}`}>
                        {changeStatus === 'modified' && '✏️ EDITED'}
                        {changeStatus === 'new' && '✨ NEW'}
                        {changeStatus === 'removed' && '🗑️ REMOVED'}
                    </div>
                )}

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
    const renderSummary = () => {
        const status = getChangeStatus('summary');

        return data.generatedSummary ? (
            <SectionWrapper id="summary" className="mb-1.5" changeStatus={status}>
                <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-0.5 tracking-wide">
                    PROFESSIONAL SUMMARY
                </h2>
                <p className="text-[9.5px] leading-[1.3] text-justify">
                    {data.generatedSummary}
                </p>
            </SectionWrapper>
        ) : (
            <SectionWrapper id="summary" className="mb-1.5">
                <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-0.5 tracking-wide">
                    PROFESSIONAL SUMMARY
                </h2>
                <p className="text-gray-400 italic text-[9px] text-center py-0.5">
                    Click to add summary
                </p>
            </SectionWrapper>
        );
    };

    const renderSkills = () => {
        const status = getChangeStatus('skills');

        return (
            <SectionWrapper id="skills" className="mb-1.5" changeStatus={status}>
                <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-0.5 tracking-wide">
                    CORE COMPETENCIES
                </h2>
                {data.competencies && data.competencies.length > 0 ? (
                    <ul className="space-y-0 text-[9.5px]">
                        {data.competencies.map((category, index) => (
                            <li key={index} className="flex leading-[1.3]">
                                <span className="mr-1">•</span>
                                <span>
                                    <span className="font-bold underline">{category.category}:</span>{" "}
                                    {category.skills.join(", ")}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400 italic text-[9px] text-center py-0.5">
                        Click to add competencies
                    </p>
                )}
            </SectionWrapper>
        );
    };

    const renderExperience = () => {
        const removedExperiences = getRemovedExperiences();

        return (
            <SectionWrapper id="experience" className="mb-1.5">
                <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-0.5 tracking-wide">
                    PROFESSIONAL EXPERIENCE
                </h2>
                {data.experience && data.experience.length > 0 ? (
                    <div className="space-y-1.5">
                        {data.experience.map((exp, index) => {
                            const itemStatus = getChangeStatus('experience', exp.id);
                            const isItemModified = itemStatus === 'modified';
                            const isItemNew = itemStatus === 'new';

                            return (
                                <div key={exp.id || index} className={`relative rounded p-1 -mx-1 transition-all ${
                                    isItemModified ? 'bg-amber-100 ring-1 ring-amber-300' :
                                    isItemNew ? 'bg-green-100 ring-1 ring-green-300' : ''
                                }`}>
                                    {/* Item-level change badge */}
                                    {(isItemModified || isItemNew) && (
                                        <span className={`absolute -right-1 -top-1 px-1 py-0.5 text-[7px] font-bold rounded shadow z-10 ${
                                            isItemModified ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                                        }`}>
                                            {isItemModified ? '✏️' : '✨'}
                                        </span>
                                    )}
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
                                                <li key={i} className="flex leading-[1.3]">
                                                    <span className="mr-1">•</span>
                                                    <span className="text-justify">{line.replace(/^[•\-]\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}

                        {/* Show removed items */}
                        {removedExperiences.map((exp, index) => (
                            <div key={`removed-${exp.id || index}`} className="relative rounded p-1 -mx-1 bg-red-100 ring-1 ring-red-300 opacity-60 line-through">
                                <span className="absolute -right-1 -top-1 px-1 py-0.5 text-[7px] font-bold rounded shadow z-10 bg-red-500 text-white">
                                    🗑️
                                </span>
                                <div className="flex justify-between items-baseline">
                                    <div className="text-[9.5px]">
                                        <span className="font-bold">{exp.role || "Job Title"}</span>
                                        <span className="mx-1">|</span>
                                        <span>{exp.company || "Company"}</span>
                                    </div>
                                    <span className="text-[9px] italic whitespace-nowrap ml-2">
                                        {exp.dates || "Dates"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-[9px] text-center py-0.5">
                        Click to add experience
                    </p>
                )}
            </SectionWrapper>
        );
    };

    const renderEducation = () => (
        <SectionWrapper id="education" className="mb-1.5">
            <h2 className="text-[11px] font-bold text-center border-b border-gray-400 pb-0.5 mb-0.5 tracking-wide">
                EDUCATION & PROFESSIONAL DEVELOPMENT
            </h2>
            {data.education && data.education.length > 0 ? (
                <div className="space-y-0 text-[9.5px]">
                    {data.education.map((edu, index) => (
                        <div key={edu.id || index} className="leading-[1.3]">
                            <span className="font-bold">{edu.degree}</span>
                            {edu.institution && <span> | {edu.institution}</span>}
                            {edu.year && <span className="italic"> ({edu.year})</span>}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 italic text-[9px] text-center py-0.5">
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
                className="px-6 py-3 min-h-[11in] text-gray-900"
                style={{ fontFamily: 'Times New Roman, Georgia, serif', fontSize: '10px' }}
            >
                {/* Header - Compact */}
                <SectionWrapper id="header" className="text-center pb-1 mb-1.5 border-b border-gray-400">
                    <h1 className="text-[18px] font-bold mb-0 tracking-wide">
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
