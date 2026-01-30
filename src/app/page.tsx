"use client";

import { Suspense } from "react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardContainer />
    </Suspense>
  );
}
