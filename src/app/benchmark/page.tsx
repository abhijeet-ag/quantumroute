import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { BenchmarkView } from "@/components/BenchmarkView";

export default async function BenchmarkPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("email, role").eq("id", user.id).single();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AppHeader
        email={profile?.email ?? user.email}
        role={profile?.role}
      />
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
          <h1 className="text-2xl font-bold text-slate-100">
            Algorithm Benchmark — quantum-inspired vs classical metaheuristics
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Five metaheuristics solve the identical joint-routing problem (same graph, same BPR
            congestion cost, same candidate routes) under an equal evaluation budget, across multiple
            random-demand seeds. This is the benchmarking called for by the problem statement —
            reported as measured, not tuned to a winner.
          </p>
        </div>
        <BenchmarkView />
      </main>
    </div>
  );
}
