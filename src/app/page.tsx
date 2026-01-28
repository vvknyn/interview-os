import { Suspense } from "react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { LoadingState } from "@/components/dashboard/LoadingState";

export default function Home() {
  return (
    <Suspense fallback={<LoadingState message="Loading dashboard..." />}>
      <DashboardContainer />
    </Suspense>
  );
}
