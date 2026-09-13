import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { fetchActiveNetwork } from "@/lib/network/fetch";
import { fetchLatestRun } from "@/lib/optimize/fetch-runs";
import { ValidationTables } from "@/components/ValidationTables";

export default async function ValidationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("email, role").eq("id", user.id).single();

  const network = await fetchActiveNetwork();
  const run = network ? await fetchLatestRun(network.id) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AppHeader
        email={profile?.email ?? user.email}
        role={profile?.role}
        right={
          <Link href="/dashboard"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800">
            Back to dashboard
          </Link>
        }
      />
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
          <h1 className="text-2xl font-bold text-slate-100">Validation — the arithmetic behind the number</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            The congestion-reduction percentage is not asserted — it is the ratio of two summed
            BPR network costs. Below is the per-segment cost for baseline vs optimized routing on
            the current run, the two totals, and the percentage computed from them. All figures are
            re-derived in your browser from the stored routes and network edges.
          </p>
        </div>

        {!network || !run ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            No run for the active network yet. Run optimization on the dashboard first.
          </div>
        ) : (
          <ValidationTables
            edges={network.edges}
            baselineRoutes={run.baseline_routes}
            optimizedRoutes={run.optimized_routes}
            storedReduction={run.congestion_reduction}
            networkLabel={network.label}
            nodes={network.nodes}
          />
        )}
      </main>
    </div>
  );
}
