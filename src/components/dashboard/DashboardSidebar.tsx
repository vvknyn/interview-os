"use client";

import { useEffect, useState } from "react";
import { User, ChatCircleDots, Code, GraduationCap, Question } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
    sections: { id: string; label: string; icon: any }[];
    activeSection: string;
    onSelectSection: (id: string) => void;
    bottomContent?: React.ReactNode;
}

export function DashboardSidebar({ sections, activeSection, onSelectSection, bottomContent }: DashboardSidebarProps) {
    return (
        <aside className="w-80 hidden lg:flex flex-col sticky top-[4.5rem] self-start h-[calc(100vh-4.5rem)] pr-6 overflow-y-auto custom-scrollbar">
            <div className="flex-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
                    Overview
                </div>
                <nav className="space-y-1">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => onSelectSection(section.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm translate-x-1"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                                )}
                            >
                                <Icon size={18} weight={isActive ? "fill" : "regular"} />
                                {section.label}
                            </button>
                        );
                    })}
                </nav>

                {bottomContent && (
                    <div className="mt-6">
                        {bottomContent}
                    </div>
                )}
            </div>
        </aside>
    );
}
