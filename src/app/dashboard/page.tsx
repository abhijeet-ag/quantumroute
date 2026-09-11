import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">QuantumRoute Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {profile?.email ?? user.email} ·{" "}
              <span className="font-medium capitalize">{role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {role === "admin" && (
              <Button asChild variant="secondary">
                <Link href="/admin">Admin panel</Link>
              </Button>
            )}
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {!network ? (
          <Card>
            <CardHeader>
              <CardTitle>No network yet</CardTitle>
              <CardDescription>
                {role === "admin"
                  ? "Go to the Admin panel to generate a demo network."
                  : "Waiting for an admin to generate a demo network."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <OptimizationDashboard network={network} latestRun={latestRun} />

            <Card>
              <CardHeader>
                <CardTitle>Congestion Trend</CardTitle>
                <CardDescription>
                  Total network congestion (travel time) across recent runs —
                  baseline vs optimized.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={trend} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
