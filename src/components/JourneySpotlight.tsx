"use client";

import { useState, useMemo } from "react";
import { SpotlightMapWrapper } from "@/components/SpotlightMapWrapper";
import type { HeatNetworkData } from "@/components/HeatNetworkMap";
import {
  highestImpactTradeoffs,
  pathTime,
} from "@/lib/optimize/journey";

type Run = {
  baseline_routes: number[][];
  optimized_routes: number[][];
  congestion_reduction: number;
};

export function JourneySpotlight({
  network,
  run,
}: {
  network: HeatNetworkData;
  run: Run;
}) {
  const edges = network.edges;
  const [selected, setSelected] = useState<number | null>(null);

  const tradeoffs = useMemo(
    () => highestImpactTradeoffs(network.nodes, edges, run.baseline_routes, run.optimized_routes),
    [network.nodes, edges, run.baseline_routes, run.optimized_routes]
  );

  // Default to the top tradeoff journey so something is always shown.
  const activeIndex = selected ?? (tradeoffs.length > 0 ? tradeoffs[0].vehicleIndex : null);

  const active = activeIndex !== null
    ? {
        baselinePath: run.baseline_routes[activeIndex],
        optimizedPath: run.optimized_routes[activeIndex],
        origin: run.baseline_routes[activeIndex][0],
        destination: run.baseline_routes[activeIndex][run.baseline_routes[activeIndex].length - 1],
      }
    : null;

  const baselineTime = active ? pathTime(active.baselinePath, edges) : 0;
  const optimizedTime = active ? pathTime(active.optimizedPath, edges) : 0;
  const delta = optimizedTime - baselineTime;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <SpotlightMapWrapper
            network={network}
            baselinePath={active?.baselinePath ?? null}
            optimizedPath={active?.optimizedPath ?? null}
            selectedSource={active?.origin ?? null}
            selectedDest={active?.destination ?? null}
            onNodeClick={() => {}}
          />
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1 w-4 rounded" style={{ background: "#dc2626" }} />
              Baseline route
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1 w-4 rounded" style={{ background: "#16a34a" }} />
              Optimized route
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {active ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="text-xs text-slate-400">Spotlighted journey</div>
              <div className="text-sm text-slate-200">
                Node <b className="font-mono text-slate-100">{active.origin}</b> → node{" "}
                <b className="font-mono text-slate-100">{active.destination}</b>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-slate-400">Baseline (rel. units)</div>
                  <div className="font-mono text-lg font-bold text-red-400">{baselineTime.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Optimized (rel. units)</div>
                  <div className="font-mono text-lg font-bold text-cyan-400">{optimizedTime.toFixed(1)}</div>
                </div>
              </div>
              {delta > 0.01 ? (
                <div className="rounded border border-amber-900/50 bg-amber-950/40 p-2 text-xs text-amber-300">
                  This journey is <b>{delta.toFixed(1)} ({((delta / baselineTime) * 100).toFixed(1)}%) longer</b> individually —
                  a deliberate tradeoff that helps cut network-wide congestion by{" "}
                  <b>{run.congestion_reduction.toFixed(1)}%</b>.
                </div>
              ) : (
                <div className="rounded border border-emerald-900/50 bg-emerald-950/40 p-2 text-xs text-emerald-300">
                  This journey is <b>{Math.abs(delta).toFixed(1)} shorter</b> and eases congestion — a win on both counts.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
              No rerouted journeys in this run. Run optimization again to generate fresh traffic.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Highest-Impact Tradeoff Journeys</div>
        <p className="mb-3 text-xs text-slate-400">
          Journeys asked to take a longer individual route so the whole network flows
          better — the drivers bearing the cost of coordination. Click one to spotlight it above.
        </p>
        {tradeoffs.length === 0 ? (
          <p className="text-sm text-slate-400">
            No tradeoff journeys in this run — no vehicle was routed longer than its own shortest path.
          </p>
        ) : (
          <div className="space-y-1">
            {tradeoffs.slice(0, 6).map((t) => (
              <button
                key={t.vehicleIndex}
                onClick={() => setSelected(t.vehicleIndex)}
                className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm text-slate-200 ${
                  t.vehicleIndex === activeIndex
                    ? "border-cyan-700 bg-slate-800"
                    : "border-slate-800 bg-slate-950 hover:border-cyan-800 hover:bg-slate-900"
                }`}
              >
                <span className="font-mono">Node {t.origin} → {t.destination}</span>
                <span className="font-mono text-amber-400">
                  +{t.delta.toFixed(1)} (+{t.pctLonger.toFixed(0)}%) longer individually
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
