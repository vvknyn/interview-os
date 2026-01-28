"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/login-form";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle>
                    <DialogDescription>
                        Sign in to save your history and access all features.
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                    <LoginForm />
                </div>
            </DialogContent>
        </Dialog>
    );
}
