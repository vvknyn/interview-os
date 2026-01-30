"use client";

import { useEffect, useState } from "react";
import { Application, getApplications } from "@/actions/application";
import { ApplicationList } from "@/components/applications/ApplicationList";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | undefined>(undefined);

    const [user, setUser] = useState<any>(null);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const result = await getApplications();
            if (result.data) {
                setApplications(result.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
        import("@/lib/supabase/client").then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.getUser().then(({ data }) => setUser(data.user));
        });
    }, []);

    const handleCreate = () => {
        setEditingApp(undefined);
        setModalOpen(true);
    };

    const handleEdit = (app: Application) => {
        setEditingApp(app);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        loadApplications();
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <Header user={user} />

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Application Tracker</h1>
                        <p className="text-muted-foreground">Manage your job applications and tailored resumes.</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Track New Application
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <ApplicationList
                        applications={applications}
                        onEdit={handleEdit}
                        onRefresh={loadApplications}
                    />
                )}

                <ApplicationModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    application={editingApp}
                    onSuccess={handleSuccess}
                />
            </main>
        </div>
    );
}
