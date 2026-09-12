"use client";

import { useState, useMemo } from "react";
import { SpotlightMapWrapper } from "@/components/SpotlightMapWrapper";
import type { HeatNetworkData } from "@/components/HeatNetworkMap";
import {
  nearestJourney,
  highestImpactTradeoffs,
  pathTime,
  type MatchedJourney,
} from "@/lib/optimize/journey";
import { Button } from "@/components/ui/button";

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
  const [source, setSource] = useState<number | null>(null);
  const [dest, setDest] = useState<number | null>(null);

  const edges = network.edges;

  const matched: MatchedJourney | null = useMemo(() => {
    if (source === null || dest === null) return null;
    return nearestJourney(source, dest, network.nodes, run.baseline_routes, run.optimized_routes);
  }, [source, dest, network.nodes, run.baseline_routes, run.optimized_routes]);

  const tradeoffs = useMemo(
    () => highestImpactTradeoffs(network.nodes, edges, run.baseline_routes, run.optimized_routes),
    [network.nodes, edges, run.baseline_routes, run.optimized_routes]
  );

  function handleNodeClick(nodeId: number) {
    if (source === null) setSource(nodeId);
    else if (dest === null && nodeId !== source) setDest(nodeId);
    else { setSource(nodeId); setDest(null); }
  }

  function reset() { setSource(null); setDest(null); }

  function spotlightTradeoff(origin: number, destination: number) {
    setSource(origin);
    setDest(destination);
  }

  const baselineTime = matched ? pathTime(matched.baselinePath, edges) : 0;
  const optimizedTime = matched ? pathTime(matched.optimizedPath, edges) : 0;
  const delta = optimizedTime - baselineTime;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>Source: <b className="font-mono text-cyan-400">{source ?? "click a node"}</b></span>
            <span>Destination: <b className="font-mono text-fuchsia-400">{dest ?? "click a node"}</b></span>
            <Button size="sm" variant="outline" onClick={reset}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-slate-100">
              Reset
            </Button>
          </div>
          <SpotlightMapWrapper
            network={network}
            baselinePath={matched?.baselinePath ?? null}
            optimizedPath={matched?.optimizedPath ?? null}
            selectedSource={source}
            selectedDest={dest}
            onNodeClick={handleNodeClick}
          />
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1 w-4 rounded" style={{ background: "#f87171" }} />
              Baseline route
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1 w-4 rounded" style={{ background: "#22d3ee" }} />
              Optimized route
            </span>
          </div>
        </div>

        {/* Journey readout */}
        <div className="space-y-3">
          {matched ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="text-xs text-slate-400">
                Nearest journey in current traffic
              </div>
              <div className="text-sm text-slate-200">
                Node <b className="font-mono text-slate-100">{matched.origin}</b> → node{" "}
                <b className="font-mono text-slate-100">{matched.destination}</b>
              </div>
              {matched.rerouted ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Baseline time</div>
                      <div className="font-mono text-lg font-bold text-red-400">{baselineTime.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Optimized time</div>
                      <div className="font-mono text-lg font-bold text-cyan-400">{optimizedTime.toFixed(1)}</div>
                    </div>
                  </div>
                  {delta > 0.01 ? (
                    <div className="rounded border border-amber-900/50 bg-amber-950/40 p-2 text-xs text-amber-300">
                      This journey is <b>{delta.toFixed(1)} ({((delta / baselineTime) * 100).toFixed(1)}%) longer</b> individually —
                      a deliberate tradeoff that helps cut network-wide congestion
                      by <b>{run.congestion_reduction.toFixed(1)}%</b>.
                    </div>
                  ) : (
                    <div className="rounded border border-emerald-900/50 bg-emerald-950/40 p-2 text-xs text-emerald-300">
                      This journey is <b>{Math.abs(delta).toFixed(1)} shorter</b> and eases congestion — a win on both counts.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded border border-slate-800 bg-slate-950 p-2 text-xs text-slate-400">
                  This journey&apos;s route was already optimal — coordination didn&apos;t change it.
                  Try a journey that was rerouted (see the list below).
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
              Click a source node, then a destination node, to spotlight the
              nearest journey and see how coordinated routing changed it.
            </div>
          )}
        </div>
      </div>

      {/* Highest-impact tradeoff journeys — legitimate analysis panel */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Highest-Impact Tradeoff Journeys</div>
        <p className="mb-3 text-xs text-slate-400">
          Journeys asked to take a longer individual route so the whole network flows
          better — the drivers bearing the cost of coordination. Click one to spotlight it.
        </p>
        {tradeoffs.length === 0 ? (
          <p className="text-sm text-slate-400">
            No tradeoff journeys in this run — no vehicle was routed longer than its own shortest path.
          </p>
        ) : (
          <div className="space-y-1">
            {tradeoffs.slice(0, 5).map((t) => (
              <button
                key={t.vehicleIndex}
                onClick={() => spotlightTradeoff(t.origin, t.destination)}
                className="flex w-full items-center justify-between rounded border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-200 hover:border-cyan-800 hover:bg-slate-900"
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
