"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ApplicationStatus = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';

export interface Application {
    id: string;
    company_name: string;
    position: string;
    job_url?: string;
    applied_at?: string;
    status: ApplicationStatus;
    resume_version_id?: string;
    cover_letter?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    resume_version?: {
        version_name: string;
    } | null;
}

export interface CreateApplicationData {
    company_name: string;
    position: string;
    job_url?: string;
    applied_at?: string;
    status: ApplicationStatus;
    resume_version_id?: string;
}

export interface UpdateApplicationData {
    company_name?: string;
    position?: string;
    job_url?: string;
    applied_at?: string;
    status?: ApplicationStatus;
    resume_version_id?: string;
    cover_letter?: string;
}

export async function getApplications() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('applications')
        .select(`
            *,
            resume_version:tailored_resumes(version_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error);
        return { error: error.message };
    }

    return { data: data as Application[] };
}

export async function createApplication(application: CreateApplicationData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from('applications')
        .insert({
            ...application,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating application:", error);
        return { error: error.message };
    }

    revalidatePath('/applications');
    return { data };
}

export async function updateApplication(id: string, updates: UpdateApplicationData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from('applications')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating application:", error);
        return { error: error.message };
    }

    revalidatePath('/applications');
    return { data };
}

export async function deleteApplication(id: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not authenticated" };
    }

    const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error("Error deleting application:", error);
        return { error: error.message };
    }

    revalidatePath('/applications');
    return { success: true };
}
