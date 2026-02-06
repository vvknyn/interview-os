"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AppShellWrapperProps {
    children: React.ReactNode;
}

export function AppShellWrapper({ children }: AppShellWrapperProps) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return <AppShell user={user}>{children}</AppShell>;
}
