import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { fetchActiveNetwork } from "@/lib/network/fetch";
import { fetchLatestRun, fetchRecentRuns } from "@/lib/optimize/fetch-runs";
import { OptimizationDashboard } from "@/components/OptimizationDashboard";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "operator";
  const network = await fetchActiveNetwork();
  const latestRun = await fetchLatestRun();
  const recentRuns = await fetchRecentRuns(8);

  const trend: TrendPoint[] = recentRuns.map((r, i) => ({
    run: `Run ${i + 1}`,
    baseline: Math.round(r.baseline_total_time),
    optimized: Math.round(r.optimized_total_time),
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AppHeader
        email={profile?.email ?? user.email}
        role={role}
        right={
          <div className="flex gap-2">
            {role === "admin" && (
              <Button asChild size="sm" className="bg-slate-800 text-slate-100 hover:bg-slate-700">
                <Link href="/admin">Admin</Link>
              </Button>
            )}
            <form action="/auth/signout" method="post">
              <Button size="sm" type="submit" className="border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-slate-100">
                Sign out
              </Button>
            </form>
          </div>
        }
      />

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
          <h1 className="text-2xl font-bold text-slate-100">
            Coordinated city routing, not one car at a time
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Standard navigation optimizes each vehicle&apos;s route independently, so
            everyone crowds the same roads. QuantumRoute routes all vehicles{" "}
            <span className="font-medium text-cyan-400">jointly</span> using a
            quantum-inspired metaheuristic, cutting total network congestion. Compare
            baseline vs optimized below.
          </p>
        </div>

        {!network ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold text-slate-100">No network yet</h2>
            <p className="mt-1 text-sm text-slate-400">
              {role === "admin"
                ? "Go to the Admin panel to generate or select a network."
                : "Waiting for an admin to select a network."}
            </p>
          </div>
        ) : (
          <>
            <div className="font-mono text-sm text-slate-400">
              <span className="text-slate-500">active_network:</span>{" "}
              <span className="text-slate-200">{network.label}</span> ·{" "}
              {network.nodes.length} intersections, {network.edges.length} segments
            </div>

            <OptimizationDashboard network={network} latestRun={latestRun} />

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold text-slate-100">Congestion Trend</h2>
              <p className="mb-3 text-sm text-slate-400">
                Total network congestion across recent runs — baseline vs optimized.
              </p>
              <TrendChart data={trend} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
