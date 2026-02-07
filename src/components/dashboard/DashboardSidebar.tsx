"use client";

import { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
    sections: { id: string; label: string; icon: any }[];
    activeSection: string;
    onSelectSection: (id: string) => void;
    bottomContent?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

const SidebarContent = ({
    sections,
    activeSection,
    onSelectSection,
    bottomContent,
    onClose
}: {
    sections: { id: string; label: string; icon: any }[];
    activeSection: string;
    onSelectSection: (id: string) => void;
    bottomContent?: React.ReactNode;
    onClose?: () => void;
}) => (
    <div className="flex-1 flex flex-col bg-background w-full">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 lg:pt-0">
            Overview
        </div>
        <nav className="space-y-0.5">
            {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                    <button
                        key={section.id}
                        onClick={() => {
                            onSelectSection(section.id);
                            if (onClose) onClose();
                        }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                            isActive
                                ? "bg-brand/10 text-brand"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
);

export function DashboardSidebar({ sections, activeSection, onSelectSection, bottomContent, isOpen, onClose }: DashboardSidebarProps) {

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="w-80 hidden lg:flex flex-col sticky top-[4.5rem] self-start h-[calc(100vh-4.5rem)] pr-6 overflow-y-auto custom-scrollbar">
                <div className="bg-muted/30 rounded-xl p-4">
                    <SidebarContent
                        sections={sections}
                        activeSection={activeSection}
                        onSelectSection={onSelectSection}
                        bottomContent={bottomContent}
                        onClose={onClose}
                    />
                </div>
            </aside>

            {/* Mobile Sidebar */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden font-sans">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={onClose}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-background shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between p-4 shadow-[var(--shadow-sm)]">
                            <span className="font-semibold text-lg tracking-tight">Menu</span>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <X size={20} weight="bold" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
                            <SidebarContent
                                sections={sections}
                                activeSection={activeSection}
                                onSelectSection={onSelectSection}
                                bottomContent={bottomContent}
                                onClose={onClose}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
