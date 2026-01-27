'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
// Quick fix for icons if not present, but better to check first.
// I'll assume lucide-react is available and just import directly or use text for now.
import { Loader2, Mail } from 'lucide-react'

export function LoginForm() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('') // Adding password for email/password flow
    const [isLoading, setIsLoading] = useState(false)
    const [isGitHubLoading, setIsGitHubLoading] = useState(false) // keeping naming generic for now
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        // Using signInWithPassword for simplicity as requested "login with ... email address" usually implies password or magic link.
        // Let's try password first as it's standard, but could also do magic link. 
        // Given the prompt didn't specify "magic link", I'll implement standard email/password AND signup.
        // Actually, handling both sign in vs sign up in one form is tricky without tabs.
        // Let's implement a simple "Sign In" and if it fails, maybe suggest sign up or have a toggle.
        // For now, I'll stick to Sign In with Password.

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            // If login fails, try signup? Or just show error?
            // Let's checking if we should auto-signup. 
            // For better UX, let's just show the error.
            setMessage(error.message)
            setIsLoading(false)
            return
        }

        router.refresh()
        router.push('/account') // Redirect to account or dashboard
        setIsLoading(false)
    }

    const handleSignUp = async () => {
        setIsLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            }
        })

        if (error) {
            setMessage(error.message)
        } else {
            setMessage("Check your email for a confirmation link.")
        }
        setIsLoading(false)
    }

    const handleOAuthLogin = async (provider: 'google' | 'apple') => {
        if (provider === 'google') setIsGoogleLoading(true)
        // if (provider === 'apple') setIsAppleLoading(true)

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            setMessage(error.message)
        }
        // No need to set loading false as it redirects.
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={handleEmailLogin}>
                <div className="grid gap-4">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Email
                        </Label>
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            disabled={isLoading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In with Email
                    </Button>
                    <Button variant="outline" type="button" disabled={isLoading} onClick={handleSignUp}>
                        Sign Up
                    </Button>
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
                <Button variant="outline" type="button" onClick={() => handleOAuthLogin('apple')}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"></path></svg>
                    Apple
                </Button>
            </div>

            {message && (
                <p className="text-sm text-red-500 text-center mt-2">{message}</p>
            )}
        </div>
    )
}
