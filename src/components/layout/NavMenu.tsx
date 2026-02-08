import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Briefcase, FileText, Gear, Heart, List, ShieldCheck, SignIn, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getAppConfig } from "@/actions/admin";

interface NavMenuProps {
    user: SupabaseUser | null;
    onSignInClick: () => void;
    onSignOut: () => void;
    isAdmin?: boolean;
}

export function NavMenu({ user, onSignInClick, onSignOut, isAdmin }: NavMenuProps) {
    const [config, setConfig] = useState<{ show_donation: boolean; donation_url: string } | null>(null);

    useEffect(() => {
        getAppConfig().then(({ data }) => {
            if (data) setConfig(data);
        });
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 border-transparent hover:bg-muted/50 transition-colors shadow-sm"
                >
                    <List size={18} weight="bold" />
                    <span className="font-medium text-sm hidden sm:inline">Menu</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
                <div className="grid gap-0.5">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Resume Tools</div>
                    <PopoverClose asChild>
                        <Link href="/resume-builder">
                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-sm font-normal">
                                <FileText size={16} className="mr-2" /> Resume Builder
                            </Button>
                        </Link>
                    </PopoverClose>

                    <div className="h-px bg-muted-foreground/10 my-1" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">General</div>

                    <PopoverClose asChild>
                        <Link href="/applications">
                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-sm font-normal">
                                <Briefcase size={16} className="mr-2" /> Applications
                            </Button>
                        </Link>
                    </PopoverClose>
                    <PopoverClose asChild>
                        <Link href="/settings">
                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-sm font-normal">
                                <Gear size={16} className="mr-2" /> Settings
                            </Button>
                        </Link>
                    </PopoverClose>

                    {config?.show_donation && config.donation_url && (
                        <PopoverClose asChild>
                            <a href={config.donation_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-sm font-normal text-pink-600 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20">
                                    <Heart size={16} weight="fill" className="mr-2" /> Buy Me a Coffee
                                </Button>
                            </a>
                        </PopoverClose>
                    )}

                    {isAdmin && (
                        <>
                            <div className="h-px bg-muted-foreground/10 my-1" />
                            <PopoverClose asChild>
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-sm font-normal">
                                        <ShieldCheck size={16} className="mr-2" /> Admin
                                    </Button>
                                </Link>
                            </PopoverClose>
                        </>
                    )}

                    <div className="h-px bg-muted-foreground/10 my-1" />

                    {user ? (
                        <PopoverClose asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-8 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={onSignOut}
                            >
                                <SignOut size={16} className="mr-2" /> Sign Out
                            </Button>
                        </PopoverClose>
                    ) : (
                        <PopoverClose asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-8 px-2 text-sm font-normal"
                                onClick={onSignInClick}
                            >
                                <SignIn size={16} className="mr-2" /> Sign In
                            </Button>
                        </PopoverClose>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
