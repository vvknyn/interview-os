"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkUsernameAvailability, signUp, signIn } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { CircleNotch } from "@phosphor-icons/react";
import { useDebouncedCallback } from "use-debounce";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export function SimpleAuthForm() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [availability, setAvailability] = useState<{ available?: boolean; checking?: boolean; message?: string } | null>(null);

    const [signInState, signInAction, isSigningIn] = useActionState(signIn, null);
    const [signUpState, signUpAction, isSigningUp] = useActionState(signUp, null);

    const state = isLogin ? signInState : signUpState;
    const action = isLogin ? signInAction : signUpAction;
    const isPending = isLogin ? isSigningIn : isSigningUp;

    // React to successful sign-in/sign-up
    useEffect(() => {
        if (state?.success) {
            const supabase = createClient();
            supabase.auth.getUser().then(() => {
                router.refresh();
            });
        }
    }, [state?.success, router]);

    const checkAvailability = useDebouncedCallback(async (value: string) => {
        if (!value || value.length < 3) {
            setAvailability(null);
            return;
        }
        setAvailability({ checking: true });
        const result = await checkUsernameAvailability(value);
        setAvailability({ ...result, checking: false });
    }, 500);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        if (!isLogin) {
            checkAvailability(value);
        } else {
            setAvailability(null);
        }
    };

    if (showForgotPassword) {
        return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
    }

    return (
        <div className="w-full max-w-xs mx-auto">
            <div className="mb-8 text-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {isLogin ? "Welcome back" : "Create account"}
                </h2>
                {/* Discrete message, minimal visibility */}
            </div>

            <form action={action} className="space-y-4">
                <div className="space-y-1">
                    <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="Username"
                        value={username}
                        onChange={handleUsernameChange}
                        className={`block w-full border-b bg-transparent py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:text-white
                            ${availability?.available === false && !isLogin ? 'border-red-300 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}
                            ${availability?.available === true && !isLogin ? 'border-green-300 focus:border-green-500' : ''}
                        `}
                    />
                    {!isLogin && username.length >= 3 && (
                        <div className="flex items-center justify-end h-4">
                            {availability?.checking ? (
                                <CircleNotch size={12} className="animate-spin text-slate-400" />
                            ) : availability?.available ? (
                                <span className="text-[10px] text-green-500 font-medium">Available</span>
                            ) : availability?.available === false ? (
                                <span className="text-[10px] text-red-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full block">
                                    {availability.message || "Taken"}
                                </span>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        required
                        placeholder="Password"
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
                    disabled={isPending || (isSigningUp && availability?.available !== true && username.length > 0)}
                    className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 mt-6"
                >
                    {isPending ? (
                        <CircleNotch size={16} className="mx-auto animate-spin" />
                    ) : (
                        isLogin ? "Enter" : "Join"
                    )}
                </button>

                {isLogin && (
                    <div className="text-center mt-3">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>
                )}
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setUsername("");
                        setAvailability(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                    {isLogin ? "Need an account?" : "Have an account?"}
                </button>
            </div>
        </div>
    );
}
