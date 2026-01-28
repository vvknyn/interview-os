import { SimpleAuthForm } from "@/components/auth/SimpleAuthForm";
import { createClient } from "@/lib/supabase/server";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { Sparkles } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <DashboardContainer />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950 px-4">
      {/* Minimal Header */}
      <div className="mb-12 flex flex-col items-center">
        <div className="mb-4">
          <Sparkles className="h-5 w-5 text-slate-900 dark:text-white" />
        </div>
        <h1 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white">
          InterviewOS
        </h1>
      </div>

      <SimpleAuthForm />
    </div>
  );
}
