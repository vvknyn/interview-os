"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    MagnifyingGlass,
    FileText,
    Briefcase,
    Gear,
    Target,
    House,
    User
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
        description: "Build & manage versions"
    },
    {
        id: "tailor",
        label: "Tailor",
        href: "/resume-tailor",
        icon: Target,
        description: "Customize for jobs"
    },
    {
        id: "applications",
        label: "Applications",
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

    // Determine active nav item based on pathname
    const getActiveItem = () => {
        if (pathname === "/" || pathname === "/dashboard") return "prepare";
        if (pathname.startsWith("/resume-builder")) return "resume";
        if (pathname.startsWith("/resume-tailor")) return "tailor";
        if (pathname.startsWith("/applications")) return "applications";
        if (pathname.startsWith("/settings") || pathname.startsWith("/account")) return "settings";
        return null;
    };

    const activeItem = getActiveItem();

    // Don't show navigation on auth pages
    const hideNav = pathname.startsWith("/login") || pathname.startsWith("/auth");
    if (hideNav) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Main content area */}
            <main className="flex-1 pb-16 lg:pb-0 lg:pl-20">
                {children}
            </main>

            {/* Desktop Side Rail - Left edge, minimal */}
            <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-background border-r border-border flex-col items-center py-6 z-50">
                {/* Logo */}
                <Link href="/" className="mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        I
                    </div>
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
                                    "group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon
                                    size={22}
                                    weight={isActive ? "fill" : "regular"}
                                />
                                <span className="text-[10px] mt-1 font-medium">
                                    {item.label}
                                </span>

                                {/* Tooltip on hover */}
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    <p className="text-xs font-medium">{item.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* User indicator at bottom */}
                {user && (
                    <Link
                        href="/account"
                        className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                            activeItem === "settings"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                            {user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                    </Link>
                )}
            </nav>

            {/* Mobile Bottom Tab Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-50 safe-area-pb">
                {NAV_ITEMS.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-[60px]",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon
                                size={22}
                                weight={isActive ? "fill" : "regular"}
                            />
                            <span className={cn(
                                "text-[10px] mt-0.5 font-medium",
                                isActive && "text-primary"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                {/* More menu for settings on mobile */}
                <Link
                    href="/settings"
                    className={cn(
                        "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all min-w-[60px]",
                        activeItem === "settings"
                            ? "text-primary"
                            : "text-muted-foreground"
                    )}
                >
                    <Gear
                        size={22}
                        weight={activeItem === "settings" ? "fill" : "regular"}
                    />
                    <span className={cn(
                        "text-[10px] mt-0.5 font-medium",
                        activeItem === "settings" && "text-primary"
                    )}>
                        More
                    </span>
                </Link>
            </nav>
        </div>
    );
}

// Page header component for consistent styling
interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
    return (
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
            <div className="px-6 py-4">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                {i > 0 && <span>/</span>}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-foreground">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
