"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    MagnifyingGlass,
    FileText,
    Briefcase,
    Gear,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AppShellProps {
    children: React.ReactNode;
    user?: SupabaseUser | null;
}

const NAV_ITEMS = [
    {
        id: "prepare",
        label: "Prepare",
        href: "/",
        icon: MagnifyingGlass,
        description: "Interview prep & research"
    },
    {
        id: "resume",
        label: "Resume",
        href: "/resume-builder",
        icon: FileText,
        description: "Build, tailor & manage"
    },
    {
        id: "applications",
        label: "Apps",
        href: "/applications",
        icon: Briefcase,
        description: "Track your applications"
    },
    {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Gear,
        description: "Account & preferences"
    }
];

export function AppShell({ children, user }: AppShellProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getActiveItem = () => {
        if (pathname === "/" || pathname === "/dashboard") return "prepare";
        if (pathname.startsWith("/resume-builder") || pathname.startsWith("/resume-tailor")) return "resume";
        if (pathname.startsWith("/applications")) return "applications";
        if (pathname.startsWith("/settings") || pathname.startsWith("/account")) return "settings";
        return null;
    };

    const activeItem = getActiveItem();

    const hideNav = pathname.startsWith("/login") || pathname.startsWith("/auth");
    if (hideNav) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 pb-[4.5rem] lg:pb-0 lg:pl-20">
                {children}
            </main>

            {/* Desktop Side Rail */}
            <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-gradient-to-b from-background via-background to-muted/30 shadow-[var(--shadow-sm)] flex-col items-center py-6 z-50">
                {/* Logo */}
                <Link href={`/${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`} className="mb-8">
                    <img
                        src="/intervu-logo.png"
                        alt="Intervu"
                        className="w-10 h-10 rounded-xl object-contain"
                    />
                </Link>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col items-center gap-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                    "group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-150",
                                    isActive
                                        ? "bg-brand/10 text-brand"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                {/* Active pill indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[7px] w-[3px] h-5 bg-brand rounded-full" />
                                )}

                                <Icon
                                    size={24}
                                    weight={isActive ? "fill" : "regular"}
                                />
                                <span className="text-[10px] mt-1 font-medium">
                                    {item.label}
                                </span>

                                {/* Tooltip */}
                                <div className="absolute left-full ml-3 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50">
                                    <p className="text-xs font-medium">{item.label}</p>
                                    <p className="text-[10px] text-white/60 dark:text-neutral-500">{item.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

            </nav>

            {/* Mobile Bottom Tab Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[4.5rem] bg-background/95 backdrop-blur-xl flex items-center justify-around px-2 z-50 shadow-[0_-4px_16px_rgb(0_0_0/0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-150 min-w-[60px]",
                                isActive
                                    ? "text-brand"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon
                                size={24}
                                weight={isActive ? "fill" : "regular"}
                            />
                            <span className={cn(
                                "text-[10px] mt-0.5 font-medium",
                                isActive && "text-brand"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="w-1 h-1 rounded-full bg-brand mt-0.5" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
