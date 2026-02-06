"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthPopoverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    showTrigger?: boolean;
}

export function AuthPopover({ open, onOpenChange, showTrigger = true }: AuthPopoverProps) {
    const handleSuccess = () => {
        onOpenChange(false);
    };

    // When no trigger, use a Dialog instead (e.g. programmatic open from buttons)
    if (!showTrigger) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle>Sign in to continue</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sign in to save versions, tailor resumes, and sync your data.
                        </p>
                    </DialogHeader>
                    <LoginForm onSuccess={handleSuccess} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-9">
                    Sign In
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0">
                <div className="p-5">
                    <div className="mb-4">
                        <h3 className="font-semibold text-base">Sign in to sync your data</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Continue using all features. Signing in saves your progress across devices.
                        </p>
                    </div>
                    <LoginForm onSuccess={handleSuccess} />
                </div>
            </PopoverContent>
        </Popover>
    );
}
