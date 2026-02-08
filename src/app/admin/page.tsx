import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/actions/admin";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default async function AdminPage() {
    const isAdmin = await isCurrentUserAdmin();

    if (!isAdmin) {
        redirect("/");
    }

    return <AdminPanel />;
}
