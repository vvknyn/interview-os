'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signIn, signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CircleNotch } from '@phosphor-icons/react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

interface LoginFormProps {
    onSuccess?: () => void;
    onGuestAccess?: () => void;
}

export function LoginForm({ onSuccess, onGuestAccess }: LoginFormProps = {}) {
    const router = useRouter()
    const supabase = createClient()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    const handleUsernameLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)

        startTransition(async () => {
            const result = await signIn(null, formData)
            if (result?.error) {
                setMessage(result.error)
            } else if (result?.success) {
                // Success - refresh server components
                router.refresh()
                // If provided, call onSuccess (e.g. close popover)
                if (onSuccess) {
                    onSuccess()
                } else {
                    // Default behavior if no callback (e.g. on login page)
                    // But we might be on a page that handles its own redirect.
                    // If we are just the form, we assume parent handles nav or we stay put?
                    // Actually, for the /login page, it has its own handler.
                    // The LoginForm is primarily used in the AuthPopover.
                }
            }
        })
    }

    const handleSignUp = async () => {
        if (!username || !password) {
            setMessage("Please enter a username and password.")
            return
        }

        setMessage(null)

        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)

        startTransition(async () => {
            const result = await signUp(null, formData)
            if (result?.error) {
                setMessage(result.error)
            } else if (result?.success) {
                // Success
                router.refresh()
                if (onSuccess) {
                    onSuccess()
                }
            }
        })
    }

    const handleOAuthLogin = async (provider: 'google' | 'apple') => {
        if (provider === 'google') setIsGoogleLoading(true)

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
            },
        })

        if (error) {
            setMessage(error.message)
            if (provider === 'google') setIsGoogleLoading(false)
        }
        // No need to set loading false on success as it redirects
    }

    if (showForgotPassword) {
        return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={handleUsernameLogin}>
                <div className="grid gap-4">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="username">
                            Username
                        </Label>
                        <Input
                            id="username"
                            placeholder="Username"
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            disabled={isPending}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="password">
                            Password
                        </Label>
                        <Input
                            id="password"
                            placeholder="Password"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            disabled={isPending}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button disabled={isPending}>
                            {isPending && (
                                <CircleNotch size={16} className="mr-2 animate-spin" />
                            )}
                            Sign In
                        </Button>
                        <Button variant="outline" type="button" disabled={isPending} onClick={handleSignUp}>
                            Sign Up
                        </Button>
                    </div>
                    {onGuestAccess && (
                        <Button variant="secondary" type="button" className="w-full" disabled={isPending} onClick={onGuestAccess}>
                            Guest Mode
                        </Button>
                    )}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>
                </div>
            </form>



            {message && (
                <p className="text-sm text-red-500 text-center mt-2">{message}</p>
            )}
        </div>
    )
}
