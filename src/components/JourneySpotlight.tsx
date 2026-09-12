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

  // Match a journey once both endpoints are picked.
  const matched: MatchedJourney | null = useMemo(() => {
    if (source === null || dest === null) return null;
    return nearestJourney(source, dest, network.nodes, run.baseline_routes, run.optimized_routes);
  }, [source, dest, network.nodes, run.baseline_routes, run.optimized_routes]);

  // Highest-impact tradeoff journeys for the panel.
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

  // Select a tradeoff journey directly: set its endpoints as the picks.
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
          <div className="flex items-center gap-3 text-sm">
            <span>Source: <b className="text-blue-600">{source ?? "click a node"}</b></span>
            <span>Destination: <b className="text-red-600">{dest ?? "click a node"}</b></span>
            <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
          </div>
          <SpotlightMapWrapper
            network={network}
            baselinePath={matched?.baselinePath ?? null}
            optimizedPath={matched?.optimizedPath ?? null}
            selectedSource={source}
            selectedDest={dest}
            onNodeClick={handleNodeClick}
          />
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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

        {/* Journey readout */}
        <div className="space-y-3">
          {matched ? (
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <div className="text-xs text-muted-foreground">
                Nearest journey in current traffic
              </div>
              <div className="text-sm">
                Node <b>{matched.origin}</b> → node <b>{matched.destination}</b>
              </div>
              {matched.rerouted ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Baseline time</div>
                      <div className="text-lg font-bold text-red-600">{baselineTime.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Optimized time</div>
                      <div className="text-lg font-bold text-green-600">{optimizedTime.toFixed(1)}</div>
                    </div>
                  </div>
                  {delta > 0.01 ? (
                    <div className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                      This journey is <b>{delta.toFixed(1)} ({((delta / baselineTime) * 100).toFixed(1)}%) longer</b> individually —
                      a deliberate tradeoff that helps cut network-wide congestion
                      by <b>{run.congestion_reduction.toFixed(1)}%</b>.
                    </div>
                  ) : (
                    <div className="rounded bg-green-50 p-2 text-xs text-green-800">
                      This journey is <b>{Math.abs(delta).toFixed(1)} shorter</b> and eases congestion — a win on both counts.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded bg-muted p-2 text-xs text-muted-foreground">
                  This journey&apos;s route was already optimal — coordination didn&apos;t change it.
                  Try a journey that was rerouted (see the list below).
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
              Click a source node, then a destination node, to spotlight the
              nearest journey and see how coordinated routing changed it.
            </div>
          )}
        </div>
      </div>

      {/* Highest-impact tradeoff journeys — legitimate analysis panel */}
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-1 font-medium">Highest-Impact Tradeoff Journeys</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Journeys asked to take a longer individual route so the whole network flows
          better — the drivers bearing the cost of coordination. Click one to spotlight it.
        </p>
        {tradeoffs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tradeoff journeys in this run — no vehicle was routed longer than its own shortest path.
          </p>
        ) : (
          <div className="space-y-1">
            {tradeoffs.slice(0, 5).map((t) => (
              <button
                key={t.vehicleIndex}
                onClick={() => spotlightTradeoff(t.origin, t.destination)}
                className="flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>Node {t.origin} → {t.destination}</span>
                <span className="text-amber-700">
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
