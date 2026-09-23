"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BENCHMARK } from "@/lib/benchmark/benchmark_data";

const SOLVERS = ["SA", "QPSO", "PSO", "GA", "ACO"] as const;
const COLORS: Record<string, string> = {
  SA: "#22d3ee", QPSO: "#a78bfa", PSO: "#f87171", GA: "#34d399", ACO: "#fbbf24",
};
const LABELS: Record<string, string> = {
  SA: "Simulated Annealing", QPSO: "Quantum-behaved PSO (QPSO)",
  PSO: "Particle Swarm (PSO)", GA: "Genetic Algorithm", ACO: "Ant Colony",
};

export function BenchmarkView() {
  const { meta, summary, convergence } = BENCHMARK;
  const ranked = [...SOLVERS].sort((a, b) => summary[b].dropMean - summary[a].dropMean);
  const topDrop = summary[ranked[0]].dropMean;

  // convergence chart data: index -> {step, SA, QPSO, ...}
  const n = convergence.SA.length;
  const chartData = Array.from({ length: n }, (_, i) => {
    const row: Record<string, number> = { step: Math.round((i / (n - 1)) * meta.budget) };
    for (const s of SOLVERS) row[s] = convergence[s][i];
    return row;
  });

  return (
    <div className="space-y-6">
      {/* summary table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">
          Solver comparison — congestion reduction vs classical baseline
        </div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          {meta.seeds} random-demand seeds · {meta.vehicles} vehicles · equal ~{meta.budget}-evaluation
          budget · identical BPR objective and candidate routes. Mean ± std over seeds.
        </p>
        <div className="overflow-hidden rounded border border-slate-800">
          <table className="w-full font-mono text-sm">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-2 text-left">solver</th>
                <th className="p-2 text-left">congestion reduction</th>
                <th className="p-2 text-right">mean cost</th>
                <th className="p-2 text-right">time</th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, idx) => {
                const st = summary[s];
                const barW = (st.dropMean / topDrop) * 100;
                return (
                  <tr key={s} className="border-t border-slate-800 text-slate-300">
                    <td className="p-2">
                      <span style={{ color: COLORS[s] }}>●</span>{" "}
                      <span className="text-slate-100">{s}</span>{" "}
                      <span className="text-slate-500">{idx === 0 ? "(best)" : ""}</span>
                    </td>
                    <td className="p-2">
                      <span className="font-bold" style={{ color: COLORS[s] }}>
                        {st.dropMean.toFixed(2)}%
                      </span>{" "}
                      <span className="text-slate-500">± {st.dropStd.toFixed(2)}</span>
                    </td>
                    <td className="p-2 text-right">{st.costMean.toFixed(0)}</td>
                    <td className="p-2 text-right">{st.timeMs.toFixed(0)}ms</td>
                    <td className="p-2">
                      <div className="h-2 rounded" style={{ width: `${barW}%`, background: COLORS[s], opacity: 0.5 }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          <span className="text-cyan-400 font-medium">Finding:</span> SA, QPSO, ACO and GA are
          statistically indistinguishable (within {(summary[ranked[0]].dropMean - summary[ranked[3]].dropMean).toFixed(2)}% ,
          well inside ±{summary.SA.dropStd.toFixed(1)}% std) — all reduce congestion ~{Math.round(summary.SA.dropMean)}%
          over classical shortest-path routing. Quantum-inspired QPSO is fully competitive with the best
          classical metaheuristics; PSO trails.
        </p>
      </div>

      {/* convergence chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 font-medium text-slate-100">Convergence — network cost vs evaluations</div>
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Lower is better. Averaged over {meta.seeds} seeds. All solvers start from the same baseline cost.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#94a3b8" fontSize={11}
              label={{ value: "evaluations", position: "insideBottom", offset: -2, fill: "#94a3b8", fontSize: 11 }} />
            <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12, fontFamily: "monospace" }}
              labelStyle={{ color: "#e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SOLVERS.map((s) => (
              <Line key={s} type="monotone" dataKey={s} name={LABELS[s]}
                stroke={COLORS[s]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
