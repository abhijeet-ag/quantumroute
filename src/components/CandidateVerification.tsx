"use client";

import { useMemo } from "react";
import { buildAdjacency, kShortestPaths, type Edge, type Node } from "@/lib/optimize/graph";

const SAMPLE_SIZE = 6;

function pathsEqual(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function CandidateVerification({
  nodes,
  edges,
  baselineRoutes,
  optimizedRoutes,
  allCheapestTotal,
  optimizerTotal,
}: {
  nodes: Node[];
  edges: Edge[];
  baselineRoutes: number[][];
  optimizedRoutes: number[][];
  allCheapestTotal: number;
  optimizerTotal: number;
}) {
  const adj = useMemo(() => buildAdjacency(nodes, edges), [nodes, edges]);

  const step = Math.max(1, Math.floor(baselineRoutes.length / SAMPLE_SIZE));
  const sampleIdx: number[] = [];
  for (let i = 0; i < baselineRoutes.length && sampleIdx.length < SAMPLE_SIZE; i += step) {
    sampleIdx.push(i);
  }

  const rows = sampleIdx.map((i) => {
    const route = baselineRoutes[i];
    const source = route[0];
    const target = route[route.length - 1];
    const candidates = kShortestPaths(adj, source, target, 3);
    const optimizedPath = optimizedRoutes[i];
    const selectedIdx = candidates.findIndex((c) => pathsEqual(c.path, optimizedPath));
    return { vehicle: i, source, target, candidates, selectedIdx, optimizedPath };
  });

  const beats = allCheapestTotal > optimizerTotal;
  const savedTotal = allCheapestTotal - optimizerTotal;
  const savedPct = allCheapestTotal > 0 ? (savedTotal / allCheapestTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">
          Candidate verification — {rows.length} sample vehicles
        </div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Each vehicle&apos;s top-3 candidate routes (Yen&apos;s algorithm), recomputed in your
          browser from the same network edges. &quot;Selected&quot; marks which candidate the
          optimizer&apos;s stored route matches. The optimizer does not always pick each
          vehicle&apos;s individually-cheapest candidate — it picks the combination that
          minimizes total network cost, which can mean an individual vehicle takes a costlier
          candidate so the shared network total is lower.
        </p>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.vehicle} className="rounded border border-slate-800 bg-slate-950 p-3">
              <div className="mb-2 font-mono text-xs text-slate-400">
                vehicle {r.vehicle} · node {r.source} → node {r.target}
              </div>
              <table className="w-full font-mono text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="p-1 text-left">candidate</th>
                    <th className="p-1 text-right">free-flow cost</th>
                    <th className="p-1 text-left">status</th>
                  </tr>
                </thead>
                <tbody>
                  {r.candidates.map((c, ci) => (
                    <tr key={ci} className="border-t border-slate-800 text-slate-300">
                      <td className="p-1">#{ci + 1}</td>
                      <td className="p-1 text-right">{c.cost.toFixed(1)}</td>
                      <td className="p-1">
                        {ci === r.selectedIdx ? (
                          <span className="text-cyan-400">selected</span>
                        ) : ci === 0 ? (
                          <span className="text-slate-500">cheapest</span>
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.selectedIdx === -1 && (
                <div className="mt-2 font-mono text-[11px] text-amber-400">
                  selected path not in recomputed top-3 — shown separately, not forced to match
                </div>
              )}
              {r.selectedIdx > 0 && (
                <div className="mt-2 font-mono text-[11px] text-slate-500">
                  not the individually-cheapest candidate — the network-level assignment chose
                  this one instead.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">The proof: coordination beats individually-greedy</div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          &quot;All-cheapest&quot; = every vehicle takes its own shortest path, ignoring everyone
          else (this is the baseline). If that were actually the network-optimal strategy, the
          optimizer would just reproduce it. It doesn&apos;t.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat label="All-cheapest total" value={allCheapestTotal.toFixed(1)} accent="text-red-400" />
          <MiniStat label="Optimizer total" value={optimizerTotal.toFixed(1)} accent="text-cyan-400" />
          <MiniStat
            label={beats ? "Saved by coordinating" : "No improvement (unexpected)"}
            value={`${savedTotal.toFixed(1)} (${savedPct.toFixed(1)}%)`}
            accent={beats ? "text-emerald-400" : "text-amber-400"}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold ${accent ?? "text-slate-100"}`}>{value}</p>
    </div>
  );
}
