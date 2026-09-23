"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { EQUILIBRIUM } from "@/lib/benchmark/equilibrium_data";
import type { HeatNetworkData } from "@/components/HeatNetworkMap";

const ForecastMap = dynamic(() => import("@/components/ForecastMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

const CAP = 3, ALPHA = 0.15, BETA = 4;
// congestion ratio 0..1+ from equilibrium load, mapped like the forecast scale
function loadToCongestion(load: number): number {
  // saturating: load/CAP capped for color; ~1 = at capacity
  return Math.min(1, load / (CAP * 1.5));
}

export function EquilibriumView({ network }: { network: HeatNetworkData }) {
  const { meta, wardrop, curve, equilLoad } = EQUILIBRIUM;

  // map equilibrium fractional loads -> a 0..1 congestion value per segment for the heat map
  const segCongestion = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(equilLoad)) out[k] = loadToCongestion(v);
    return out;
  }, [equilLoad]);

  return (
    <div className="space-y-6">
      {/* framing */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm leading-relaxed text-slate-300">
          Iterative traffic assignment repeatedly re-routes all vehicles as segment travel times
          rise with load (BPR), averaging flows via the Method of Successive Averages until they
          stabilise. It converges to <span className="text-cyan-400 font-medium">Wardrop user-equilibrium</span> —
          the state where no vehicle can reach its destination faster by switching routes.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This is a <span className="text-slate-200">complement</span> to our one-shot metaheuristic,
          not a replacement: the metaheuristic is fast and deployable; equilibrium assignment is the
          slower, rigorous reference. This is a dynamic-weight mechanism — edge weights update each
          iteration with congestion.
        </p>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat label="Iters to converge (<5e-3)" value={`${meta.convergedIter}`} />
        <Stat label="Refined gap (1000 iters)" value={meta.refinedGap.toExponential(1)} accent="text-cyan-400" />
        <Stat label="Congestion vs baseline" value={`−${meta.dropPct}%`} accent="text-cyan-400" />
        <Stat label="Wardrop violations" value={`${wardrop.violations}`} accent="text-green-400" />
      </div>

      {/* convergence chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Convergence to equilibrium</div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Relative gap per iteration (log scale). Crosses the 5e-3 convergence threshold at iteration {meta.convergedIter}, then refines to {meta.refinedGap.toExponential(1)} over the full run.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={curve} margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="iter" stroke="#94a3b8" fontSize={11}
              label={{ value: "iteration", position: "insideBottom", offset: -2, fill: "#94a3b8", fontSize: 11 }} />
            <YAxis stroke="#94a3b8" fontSize={11} scale="log" domain={["auto", "auto"]}
              tickFormatter={(v) => v.toExponential(0)} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, fontFamily: "monospace" }} labelStyle={{ color: "#e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="gap" name="convergence gap" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* equilibrium flow map */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Equilibrium flow — congestion by segment</div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Segment congestion at equilibrium (fractional flow → BPR load). Aggregate flow pattern,
          not individual vehicle routes.
        </p>
        <ForecastMap network={network} predictions={segCongestion} />
      </div>

      {/* Wardrop proof */}
      <div className="rounded-xl border border-green-900/50 bg-green-950/30 p-4">
        <div className="mb-1 font-medium text-green-300">Equilibrium proof — Wardrop conditions</div>
        <p className="mb-3 text-xs text-slate-400">
          User-equilibrium is <span className="text-slate-200">defined</span> by two conditions.
          Both hold at convergence — this is the validation equivalent for equilibrium mode.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-950 p-3 text-sm">
            <div className="text-slate-300">① All used routes have equal travel time</div>
            <div className="mt-1 font-mono text-xs text-slate-400">
              among routes carrying real flow (≥0.1): avg gap{" "}
              <span className="text-green-400">{wardrop.avgUsedGapPct}%</span>, max{" "}
              <span className="text-green-400">{wardrop.maxUsedGapPct}%</span>
            </div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 p-3 text-sm">
            <div className="text-slate-300">② No vehicle can improve by switching</div>
            <div className="mt-1 font-mono text-xs text-slate-400">
              improving deviations: <span className="text-green-400">{wardrop.violations} / {meta.vehicles}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          <span className="text-cyan-400 font-medium">What we exclude:</span> nothing stale —
          {" "}<span className="text-slate-200">{wardrop.staleResiduePct}%</span> stale residue after
          pruning. <span className="text-slate-200">~{wardrop.splitFlowPct}%</span> of demand splits
          across equal-cost routes ({wardrop.multiRouteVehicles} vehicles) — this is genuine
          Wardrop-predicted multi-path usage, reported openly, not filtered out.
        </p>
      </div>

      {/* boundary note */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Why no per-journey spotlight here</div>
        <p className="text-sm text-slate-400">
          Equilibrium assignment produces <span className="text-slate-200">aggregate flow</span> (fractional
          segment usage), not discrete per-vehicle routes. Per-journey spotlight and tradeoff analysis
          apply to the one-shot optimizer, which assigns each vehicle a specific route. Equilibrium answers
          “what is the network-optimal flow pattern?”, not “what route does vehicle X take?” — a deliberate
          modelling distinction, not a missing feature.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="h-1 w-full bg-cyan-500" />
      <div className="p-4">
        <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-1 font-mono text-2xl font-bold ${accent ?? "text-slate-100"}`}>{value}</p>
      </div>
    </div>
  );
}
