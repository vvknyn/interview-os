"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface AuthPopoverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuthPopover({ open, onOpenChange }: AuthPopoverProps) {
    const handleSuccess = () => {
        // Close popover on successful authentication
        onOpenChange(false);
    };

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
