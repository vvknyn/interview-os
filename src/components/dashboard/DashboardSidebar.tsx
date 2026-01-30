"use client";

import { useEffect, useState } from "react";
import { User, ChatCircleDots, Code, GraduationCap, Question, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
    sections: { id: string; label: string; icon: any }[];
    activeSection: string;
    onSelectSection: (id: string) => void;
    bottomContent?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

export function DashboardSidebar({ sections, activeSection, onSelectSection, bottomContent, isOpen, onClose }: DashboardSidebarProps) {

    // Prevent scrolling when mobile menu is open
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

    const SidebarContent = () => (
        <div className="flex-1 flex flex-col bg-background w-full">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 lg:pt-0">
                Overview
            </div>
            <nav className="space-y-1">
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
                                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

    return (
        <>
            {/* Desktop Sidebar (Sticky) */}
            <aside className="w-80 hidden lg:flex flex-col sticky top-[4.5rem] self-start h-[calc(100vh-4.5rem)] pr-6 overflow-y-auto custom-scrollbar">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Overlay) */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden font-sans">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={onClose}
                    />
                    {/* Drawer */}
                    <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-zinc-950 border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">Menu</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                            >
                                <X size={20} weight="bold" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
                            <SidebarContent />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
