"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { CircleNotch, CheckCircle } from "@phosphor-icons/react";

export function ResetPasswordForm() {
    const router = useRouter();
    const [state, action, isPending] = useActionState(resetPassword, null);

    useEffect(() => {
        if (state?.success) {
            const timer = setTimeout(() => {
                router.push("/");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state?.success, router]);

    if (state?.success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-xs text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                            <CheckCircle size={24} weight="fill" className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Password updated
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Redirecting you to the app...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-xs">
                <div className="mb-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Set new password
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Enter your new password below
                    </p>
                </div>

                <form action={action} className="space-y-4">
                    <div className="space-y-1">
                        <input
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="New password"
                            minLength={6}
                            className="block w-full border-b border-slate-300 bg-transparent py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <input
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Confirm password"
                            minLength={6}
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
                            "Update password"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
