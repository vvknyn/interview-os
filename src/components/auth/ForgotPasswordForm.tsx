"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import { CircleNotch, EnvelopeSimple, ArrowLeft } from "@phosphor-icons/react";

interface ForgotPasswordFormProps {
    onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
    const [state, action, isPending] = useActionState(requestPasswordReset, null);

    if (state?.success) {
        return (
            <div className="w-full max-w-xs mx-auto text-center">
                <div className="mb-6 flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <EnvelopeSimple size={24} className="text-foreground" />
                    </div>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Check your email
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    If an account with that username exists, we&apos;ve sent a password reset link to your email.
                </p>
                <button
                    onClick={onBack}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                    Back to login
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xs mx-auto">
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors mb-4"
                >
                    <ArrowLeft size={12} />
                    Back
                </button>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white text-center">
                    Reset password
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                    Enter your username and a real email to receive a reset link
                </p>
            </div>

            <form action={action} className="space-y-4">
                <div className="space-y-1">
                    <input
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="Username"
                        className="block w-full border-b border-slate-300 bg-transparent py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
                    />
                </div>

                <div className="space-y-1">
                    <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="Your real email"
                        className="block w-full border-b border-slate-300 bg-transparent py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
                    />
                </div>

                {state?.error && (
                    <div className="mt-2 text-xs text-red-500 text-center">
                        {state.error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 mt-6"
                >
                    {isPending ? (
                        <CircleNotch size={16} className="mx-auto animate-spin" />
                    ) : (
                        "Send reset link"
                    )}
                </button>
            </form>
        </div>
    );
}
