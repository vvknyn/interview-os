"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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

    return { success: true };
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
        if (error.message.includes("Invalid login credentials")) {
            // Check if email was changed by an abandoned password reset flow
            try {
                const adminClient = await createAdminClient();
                const { data: profile } = await adminClient
                    .from("profiles")
                    .select("id")
                    .eq("username", username)
                    .single();

                if (profile) {
                    // User exists — check if their auth email was changed
                    const { data: userData } = await adminClient.auth.admin.getUserById(profile.id);
                    if (userData?.user && userData.user.email !== email) {
                        // Email was changed (abandoned reset flow) — revert it
                        await adminClient.auth.admin.updateUserById(profile.id, { email });
                        // Retry sign-in with corrected email
                        const { error: retryError } = await supabase.auth.signInWithPassword({
                            email,
                            password,
                        });
                        if (!retryError) {
                            return { success: true };
                        }
                    }
                }
            } catch (e) {
                console.error("[Auth] Email revert check failed:", e);
            }

            return { error: "Invalid username or password" };
        }
        return { error: error.message };
    }

    return { success: true };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Revalidate to clear cached session data
    revalidatePath("/", "layout");

    redirect("/");
}

/**
 * Delete the current user's account and all associated data.
 * localStorage must be cleared client-side before calling this.
 */
export async function deleteAccount(): Promise<{ error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const adminClient = await createAdminClient();

    // CASCADE foreign keys ensure all related data is deleted
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
        console.error("[Auth] Delete account error:", error);
        return { error: error.message };
    }

    // Sign out the current session
    await supabase.auth.signOut();

    return {};
}

/**
 * Request a password reset email.
 * User provides their username and a real email address where the reset link will be sent.
 * The real email is temporarily set on the auth user, then reverted after the reset.
 */
export async function requestPasswordReset(prevState: any, formData: FormData) {
    const username = (formData.get("username") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();

    if (!username || !email) {
        return { error: "Username and email are required" };
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "Please enter a valid email address" };
    }

    try {
        const adminClient = await createAdminClient();

        // Look up user by username in profiles
        const { data: profile } = await adminClient
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();

        if (!profile) {
            // Don't reveal whether username exists — still return success
            return { success: true };
        }

        // Temporarily set the real email on the auth user
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            profile.id,
            { email }
        );

        if (updateError) {
            console.error("[Auth] Failed to set reset email:", updateError);
            return { error: "Failed to process reset request. Please try again." };
        }

        // Determine the site URL for the redirect
        const headerList = await headers();
        const host = headerList.get("host") || "localhost:3000";
        const protocol = headerList.get("x-forwarded-proto") || "http";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

        // Send the password reset email
        const supabase = await createClient();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
        });

        if (resetError) {
            console.error("[Auth] Failed to send reset email:", resetError);
            // Revert email back to dummy
            const dummyEmail = getEmailFromUsername(username);
            await adminClient.auth.admin.updateUserById(profile.id, { email: dummyEmail });
            return { error: "Failed to send reset email. Please try again." };
        }

        return { success: true };
    } catch (e) {
        console.error("[Auth] Password reset request error:", e);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

/**
 * Reset password for a user who clicked the reset link in their email.
 * The user must have an active session (established by the auth callback code exchange).
 */
export async function resetPassword(prevState: any, formData: FormData) {
    const password = (formData.get("password") as string)?.trim();
    const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

    if (!password || !confirmPassword) {
        return { error: "Both password fields are required" };
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    try {
        const supabase = await createClient();

        // Get the current user (session established by auth callback)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: "Session expired. Please request a new reset link." };
        }

        // Update the password
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
            console.error("[Auth] Password update error:", updateError);
            return { error: "Failed to update password. Please try again." };
        }

        // Revert email back to dummy
        const adminClient = await createAdminClient();
        const { data: profile } = await adminClient
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

        if (profile?.username) {
            const dummyEmail = getEmailFromUsername(profile.username);
            await adminClient.auth.admin.updateUserById(user.id, { email: dummyEmail });
        }

        return { success: true };
    } catch (e) {
        console.error("[Auth] Password reset error:", e);
        return { error: "An unexpected error occurred. Please try again." };
    }
}
