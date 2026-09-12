"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type TrendPoint = {
  run: string;
  baseline: number;
  optimized: number;
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-400">
        Run optimization at least twice to see a trend.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="run" fontSize={12} stroke="#94a3b8" />
        <YAxis fontSize={12} stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "monospace",
          }}
          labelStyle={{ color: "#e2e8f0" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
        <Line
          type="monotone"
          dataKey="baseline"
          name="Baseline congestion"
          stroke="#f87171"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="optimized"
          name="Optimized congestion"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
