"use client";

import { useMemo } from "react";
import { segmentCosts, type Edge } from "@/lib/optimize/bpr";
import { CandidateVerification } from "@/components/CandidateVerification";

type Node = { id: number; lat: number; lng: number };

export function ValidationTables({
  edges,
  baselineRoutes,
  optimizedRoutes,
  storedReduction,
  networkLabel,
  nodes,
}: {
  edges: Edge[];
  baselineRoutes: number[][];
  optimizedRoutes: number[][];
  storedReduction: number;
  networkLabel: string;
  nodes: Node[];
}) {
  const base = useMemo(() => segmentCosts(baselineRoutes, edges), [baselineRoutes, edges]);
  const opt = useMemo(() => segmentCosts(optimizedRoutes, edges), [optimizedRoutes, edges]);

  const reduction = base.total > 0 ? ((base.total - opt.total) / base.total) * 100 : 0;
  const matches = Math.abs(reduction - storedReduction) < 0.5;

  const baseMap = new Map(base.rows.map((r) => [r.key, r]));
  const optMap = new Map(opt.rows.map((r) => [r.key, r]));
  const allKeys = Array.from(new Set([...base.rows, ...opt.rows].map((r) => r.key)));
  allKeys.sort((a, b) => {
    const bc = (baseMap.get(b)?.cost ?? 0) - (baseMap.get(a)?.cost ?? 0);
    return bc;
  });

  return (
    <div className="space-y-6">
      {/* Totals + % */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Baseline BPR total" value={base.total.toFixed(1)} accent="text-red-400" />
        <Stat label="Optimized BPR total" value={opt.total.toFixed(1)} accent="text-cyan-400" />
        <Stat label="Reduction = (B−O)/B" value={`${reduction.toFixed(2)}%`} accent="text-cyan-400" />
      </div>

      <div className={`rounded-lg border p-3 text-sm font-mono ${matches ? "border-emerald-900/50 bg-emerald-950/40 text-emerald-300" : "border-amber-900/50 bg-amber-950/40 text-amber-300"}`}>
        Re-derived {reduction.toFixed(2)}% vs stored {storedReduction.toFixed(2)}% —{" "}
        {matches ? "match (pipeline verified)." : "MISMATCH — investigate."}
      </div>

      {/* Per-segment table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Per-segment BPR cost ({networkLabel})</div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          unit cost = freeflow × (1 + 0.15 × (load / 3)^4). Table total = unit cost × load
          (every vehicle on that segment pays the congested unit cost). Rows sorted by baseline
          total. Showing all segments used.
        </p>
        <div className="max-h-[420px] overflow-auto rounded border border-slate-800">
          <table className="w-full font-mono text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400">
              <tr>
                <th className="p-2 text-left">segment</th>
                <th className="p-2 text-right">freeflow</th>
                <th className="p-2 text-right">base load</th>
                <th className="p-2 text-right">base total (u×n)</th>
                <th className="p-2 text-right">opt load</th>
                <th className="p-2 text-right">opt total (u×n)</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map((k) => {
                const b = baseMap.get(k);
                const o = optMap.get(k);
                return (
                  <tr key={k} className="border-t border-slate-800 text-slate-300">
                    <td className="p-2">{k}</td>
                    <td className="p-2 text-right">{(b?.freeFlow ?? o?.freeFlow ?? 0).toFixed(1)}</td>
                    <td className="p-2 text-right">{b?.load ?? 0}</td>
                    <td className="p-2 text-right text-red-300">{(b?.cost ?? 0).toFixed(1)}</td>
                    <td className="p-2 text-right">{o?.load ?? 0}</td>
                    <td className="p-2 text-right text-cyan-300">{(o?.cost ?? 0).toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-950 font-bold text-slate-100">
              <tr className="border-t-2 border-slate-700">
                <td className="p-2">TOTAL</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2 text-right text-red-400">{base.total.toFixed(1)}</td>
                <td className="p-2"></td>
                <td className="p-2 text-right text-cyan-400">{opt.total.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <CandidateVerification
        nodes={nodes}
        edges={edges}
        baselineRoutes={baselineRoutes}
        optimizedRoutes={optimizedRoutes}
        allCheapestTotal={base.total}
        optimizerTotal={opt.total}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="h-1 w-full bg-cyan-500" />
      <div className="p-5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-1.5 font-mono text-3xl font-bold ${accent ?? "text-slate-100"}`}>{value}</p>
      </div>
    </div>
  );
}
