"use client";

import { useMemo } from "react";
import { buildAdjacency, kShortestPaths } from "@/lib/optimize/graph";
import { segmentCosts, type Edge } from "@/lib/optimize/bpr";

type Node = { id: number; lat: number; lng: number };

function freeFlow(path: number[], edges: Edge[]): number {
  const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const w = new Map<string, number>();
  for (const e of edges) w.set(ek(e.from, e.to), e.weight);
  let t = 0;
  for (let i = 0; i < path.length - 1; i++) t += w.get(ek(path[i], path[i + 1])) ?? 0;
  return t;
}

export function CandidateVerification({
  nodes,
  edges,
  baselineRoutes,
  optimizedRoutes,
  sampleSize = 6,
}: {
  nodes: Node[];
  edges: Edge[];
  baselineRoutes: number[][];
  optimizedRoutes: number[][];
  sampleSize?: number;
}) {
  const analysis = useMemo(() => {
    const adj = buildAdjacency(nodes, edges);
    // Even sample across the vehicle list.
    const n = baselineRoutes.length;
    const step = Math.max(1, Math.floor(n / sampleSize));
    const sample: number[] = [];
    for (let i = 0; i < n && sample.length < sampleSize; i += step) sample.push(i);

    const rows = sample.map((vi) => {
      const b = baselineRoutes[vi];
      const opt = optimizedRoutes[vi];
      const src = b[0];
      const dst = b[b.length - 1];
      const cands = kShortestPaths(adj, src, dst, 3).map((c) => ({
        path: c.path,
        cost: freeFlow(c.path, edges),
      }));
      cands.sort((a, c) => a.cost - c.cost);
      const optKey = opt.join(",");
      const selectedIdx = cands.findIndex((c) => c.path.join(",") === optKey);
      const cheapestCost = cands.length ? cands[0].cost : 0;
      const optCost = freeFlow(opt, edges);
      return {
        vi, src, dst, cands,
        selectedIdx, // -1 if optimized path not in recomputed top-3
        optCost,
        cheapestCost,
        tookCheapest: Math.abs(optCost - cheapestCost) < 0.05,
      };
    });

    // Network-level proof: all-cheapest (= baseline shortest) vs optimizer actual.
    const allCheapestTotal = segmentCosts(baselineRoutes, edges).total;
    const optimizerTotal = segmentCosts(optimizedRoutes, edges).total;

    return { rows, allCheapestTotal, optimizerTotal };
  }, [nodes, edges, baselineRoutes, optimizedRoutes, sampleSize]);

  const { rows, allCheapestTotal, optimizerTotal } = analysis;
  const savedPct = allCheapestTotal > 0
    ? ((allCheapestTotal - optimizerTotal) / allCheapestTotal) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Network proof */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">
          Why not just give every vehicle its shortest route?
        </div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          If every vehicle took its individually-cheapest (shortest) candidate, they crowd
          the same corridors. The optimizer selects a coordinated combination from each
          vehicle&apos;s candidate set that lowers total network BPR cost.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="All-shortest network cost" value={allCheapestTotal.toFixed(1)} accent="text-red-400" />
          <Stat label="Optimizer network cost" value={optimizerTotal.toFixed(1)} accent="text-cyan-400" />
          <Stat label="Coordinated saving" value={`${savedPct.toFixed(2)}%`} accent="text-cyan-400" />
        </div>
      </div>

      {/* Per-vehicle candidate table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">
          Candidate verification (sample of {rows.length} vehicles)
        </div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Each vehicle&apos;s k=3 shortest candidate routes (Yen&apos;s algorithm), free-flow cost each.
          The optimizer&apos;s selection is marked ✓ — note it is often NOT the individually-cheapest
          candidate, because the objective is joint network cost, not per-vehicle cost. Verification
          is against the generated candidate set, not the entire road network.
        </p>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.vi} className="rounded border border-slate-800 bg-slate-950 p-3">
              <div className="mb-2 font-mono text-xs text-slate-300">
                Vehicle {r.vi}: node {r.src} → {r.dst}
                {r.selectedIdx === -1 && (
                  <span className="ml-2 text-amber-400">
                    (selected path not in recomputed top-3 — shown below)
                  </span>
                )}
              </div>
              <table className="w-full font-mono text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="p-1 text-left">candidate</th>
                    <th className="p-1 text-right">hops</th>
                    <th className="p-1 text-right">free-flow cost</th>
                    <th className="p-1 text-right">selected</th>
                  </tr>
                </thead>
                <tbody>
                  {r.cands.map((c, ci) => {
                    const isSel = ci === r.selectedIdx;
                    return (
                      <tr key={ci} className={isSel ? "text-cyan-300" : "text-slate-400"}>
                        <td className="p-1">#{ci + 1}{ci === 0 ? " (cheapest)" : ""}</td>
                        <td className="p-1 text-right">{c.path.length - 1}</td>
                        <td className="p-1 text-right">{c.cost.toFixed(1)}</td>
                        <td className="p-1 text-right">{isSel ? "✓" : ""}</td>
                      </tr>
                    );
                  })}
                  {r.selectedIdx === -1 && (
                    <tr className="text-amber-300">
                      <td className="p-1">selected (outside top-3)</td>
                      <td className="p-1 text-right">—</td>
                      <td className="p-1 text-right">{r.optCost.toFixed(1)}</td>
                      <td className="p-1 text-right">✓</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="h-1 w-full bg-cyan-500" />
      <div className="p-4">
        <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-1 font-mono text-2xl font-bold ${accent ?? "text-slate-100"}`}>{value}</p>
      </div>
    </div>
  );
}
