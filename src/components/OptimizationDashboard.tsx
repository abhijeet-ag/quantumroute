"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">Run Optimization</h2>
          <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-xs text-amber-400">
            Simulated demo data — not live traffic
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={runOptimization}
            disabled={loading}
            className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          >
            {loading ? "Optimizing…" : "Run Optimization"}
          </Button>
          <p className="text-sm text-slate-400">
            Generates fresh traffic, routes it two ways, and compares.
          </p>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      {latestRun ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Congestion reduction"
              value={`${latestRun.congestion_reduction.toFixed(1)}%`}
              accent="text-cyan-400"
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

          <div className="rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-4">
              <h2 className="font-semibold text-slate-100">Congestion Map</h2>
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
            </div>
            <div className="space-y-3 p-4">
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
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-slate-400">
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
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-400">
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
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="h-1 w-full bg-cyan-500" />
      <div className="p-5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={`mt-1.5 font-mono text-4xl font-bold tracking-tight ${accent ?? "text-slate-100"}`}>
          {value}
        </p>
        {sub && <p className="mt-1 font-mono text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}
