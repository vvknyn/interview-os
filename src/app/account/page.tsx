import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"

export default async function AccountPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    return (
        <div className="container max-w-2xl py-10">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Account</h1>
                    <p className="text-muted-foreground">Manage your account settings</p>
                </div>

                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <div className="grid gap-2">
                        <div className="font-semibold">Email</div>
                        <div>{user.email}</div>
                    </div>
                </div>

                <form action="/auth/signout" method="post">
                    <Button variant="destructive" type="submit">Sign Out</Button>
                </form>
            </div>
        </div>
    )
}
