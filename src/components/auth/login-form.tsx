'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signIn, signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

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
                    <Button disabled={isPending}>
                        {isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" type="button" disabled={isPending} onClick={handleSignUp}>
                            Sign Up
                        </Button>
                        {onGuestAccess && (
                            <Button variant="secondary" type="button" disabled={isPending} onClick={onGuestAccess}>
                                Guest Mode
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="grid gap-2">
                <Button variant="outline" type="button" disabled={isGoogleLoading} onClick={() => handleOAuthLogin('google')}>
                    {isGoogleLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    )}
                    Google
                </Button>
            </div>

            {message && (
                <p className="text-sm text-red-500 text-center mt-2">{message}</p>
            )}
        </div>
    )
}
