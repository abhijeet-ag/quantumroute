"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeatNetworkMapWrapper } from "@/components/HeatNetworkMapWrapper";
import { DualHeatMap } from "@/components/DualHeatMap";
import { JourneySpotlight } from "@/components/JourneySpotlight";
import type { HeatNetworkData } from "@/components/HeatNetworkMap";

type Run = {
  baseline_total_time: number;
  optimized_total_time: number;
  time_saved: number;
  congestion_reduction: number;
  vehicles_rerouted: number;
  vehicle_count: number;
  baseline_routes: number[][];
  optimized_routes: number[][];
};

export function OptimizationDashboard({
  network,
  latestRun,
}: {
  network: HeatNetworkData;
  latestRun: Run | null;
}) {
  const router = useRouter();
  const [layout, setLayout] = useState<"single" | "split" | "spotlight">("split");
  const [view, setView] = useState<"baseline" | "optimized">("optimized");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runOptimization() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/optimize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Optimization failed");
      else router.refresh();
    } catch (e) {
      setError("Request failed: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const singleRoutes = latestRun
    ? view === "baseline"
      ? latestRun.baseline_routes
      : latestRun.optimized_routes
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Run Optimization</span>
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-normal text-amber-800">
              Simulated demo data — not live traffic
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={runOptimization} disabled={loading}>
              {loading ? "Optimizing…" : "Run Optimization"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Generates fresh traffic, routes it two ways, and compares.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {latestRun ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Congestion reduction"
              value={`${latestRun.congestion_reduction.toFixed(1)}%`}
              accent="text-green-600"
            />
            <MetricCard
              label="Total travel time saved"
              value={latestRun.time_saved.toFixed(0)}
              sub={`of ${latestRun.baseline_total_time.toFixed(0)} baseline`}
            />
            <MetricCard
              label="Vehicles rerouted"
              value={`${latestRun.vehicles_rerouted} / ${latestRun.vehicle_count}`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Congestion Map</span>
                <div className="flex items-center gap-2">
                  <Tabs value={layout} onValueChange={(v) => setLayout(v as "single" | "split" | "spotlight")}>
                    <TabsList>
                      <TabsTrigger value="split">Side by side</TabsTrigger>
                      <TabsTrigger value="single">Single</TabsTrigger>
                      <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {layout === "single" && (
                    <Tabs value={view} onValueChange={(v) => setView(v as "baseline" | "optimized")}>
                      <TabsList>
                        <TabsTrigger value="baseline">Baseline</TabsTrigger>
                        <TabsTrigger value="optimized">Optimized</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {layout === "spotlight" ? (
                <JourneySpotlight network={network} run={latestRun} />
              ) : layout === "split" ? (
                <DualHeatMap
                  network={network}
                  baselineRoutes={latestRun.baseline_routes}
                  optimizedRoutes={latestRun.optimized_routes}
                />
              ) : (
                <HeatNetworkMapWrapper network={network} routes={singleRoutes} />
              )}
              {layout !== "spotlight" && (
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#22c55e" }} />
                    Free-flowing
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#eab308" }} />
                    Busy
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} />
                    Congested
                  </span>
                  <span className="ml-auto">Thicker + redder = more vehicles on that segment</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-background text-sm text-muted-foreground">
          No optimization run yet — click &ldquo;Run Optimization&rdquo; above.
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-3xl font-bold ${accent ?? ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
