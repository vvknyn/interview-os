"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function getEmailFromUsername(username: string) {
    // Create a consistent dummy email for the username
    // We use a specific domain to avoid conflicts with real emails if we ever open that up
    return `${username}@example.com`;
}

export async function checkUsernameAvailability(username: string) {
    const supabase = await createClient();

    // Check if username exists in profiles
    const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

    if (error && error.code === 'PGRST116') {
        // No rows returned means username is available
        return { available: true };
    }

    if (error) {
        console.error("Error checking username availability:", error);
        return { available: false, message: `Error: ${error.message} (${error.code})` };
    }

    if (data) {
        return { available: false, message: "Username is already taken" };
    }

    return { available: false, message: "Unknown error checking username" };
}

export async function signUp(prevState: any, formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    if (username.length < 3) {
        return { error: "Username must be at least 3 characters" };
    }

    const supabase = await createClient();

    // 1. Check availability again to be safe
    const { available } = await checkUsernameAvailability(username);
    if (!available) {
        return { error: "Username is already taken" };
    }

    // 2. Sign up with Supabase Auth (using Admin API to bypass rate limits and auto-confirm)
    // We use a specific domain to avoid conflicts with real emails
    const email = getEmailFromUsername(username);

    // Use Admin Client
    const supabaseAdmin = await createAdminClient();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: "Failed to create user" };
    }

    // 3. Create Profile record using Admin Client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert([
            {
                id: authData.user.id,
                username: username,
            },
        ]);

    if (profileError) {
        console.error("Profile creation error:", profileError);
        // Rollback: Delete the user we just created so they can try again
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return { error: `Profile setup failed: ${profileError.message}. Please try again.` };
    }

    // 4. Manually Sign In the user to set the session cookies
    // Since we used admin.createUser, no session is set on the client/browser yet.
    // We must sign them in now.
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInError) {
        console.error("Auto-signin error:", signInError);
        return { error: "Account created, but failed to log you in automatically. Please log in." };
    }

    redirect("/dashboard");
}

export async function signIn(prevState: any, formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    const supabase = await createClient();
    const email = getEmailFromUsername(username);

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Customize error message for security/usability
        if (error.message.includes("Invalid login credentials")) {
            return { error: "Invalid username or password" };
        }
        return { error: error.message };
    }

    redirect("/dashboard");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
