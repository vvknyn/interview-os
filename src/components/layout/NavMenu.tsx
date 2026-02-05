import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Briefcase, FileText, Gear, List, SignIn, SignOut, User, MagicWand } from "@phosphor-icons/react";
import Link from "next/link";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface NavMenuProps {
    user: SupabaseUser | null;
    onSignInClick: () => void;
    onSignOut: () => void;
}

export function NavMenu({ user, onSignInClick, onSignOut }: NavMenuProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-10 px-4 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors shadow-sm"
                >
                    <List size={20} weight="bold" />
                    <span className="font-semibold text-sm">Menu</span>
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

                    <div className="h-px bg-border my-1" />
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

                    <div className="h-px bg-border my-1" />

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
