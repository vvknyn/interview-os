import { Suspense } from "react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <DashboardContainer />
        </Suspense>
    );
}
