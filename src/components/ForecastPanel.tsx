"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { HeatNetworkData } from "@/components/HeatNetworkMap";
import type { PredictionData } from "@/lib/optimize/fetch-predictions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ForecastMap = dynamic(() => import("@/components/ForecastMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-400">
      Loading forecast…
    </div>
  ),
});

function timeAgo(iso: string | null): string {
  if (!iso) return "unknown";
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "less than an hour ago";
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export function ForecastPanel({
  network,
  predictions,
}: {
  network: HeatNetworkData;
  predictions: PredictionData | null;
}) {
  const [slot, setSlot] = useState(predictions?.slots[0]?.time_slot ?? "");

  if (!predictions) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-400">
        No congestion forecast available for this network.
      </div>
    );
  }

  const activeSlot = predictions.slots.find((s) => s.time_slot === slot) ?? predictions.slots[0];
  const segPreds = predictions.bySlot[activeSlot.time_slot] ?? {};

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
        <p className="mb-2 font-mono text-[11px] text-slate-400">
          ML congestion forecast — trained XGBoost model (R²≈0.90) predicts near-term congestion
          per segment. The optimizer routes on live demand; this forecast supports scheduling and
          pre-positioning. Predictions updated {timeAgo(predictions.batchAt)}.
        </p>
        <Tabs value={activeSlot.time_slot} onValueChange={setSlot}>
          <TabsList>
            {predictions.slots.map((s) => (
              <TabsTrigger key={s.time_slot} value={s.time_slot}>{s.slot_label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <ForecastMap network={network} predictions={segPreds} />
      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#22c55e" }} />
          Low predicted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#eab308" }} />
          Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} />
          High predicted
        </span>
      </div>
    </div>
  );
}
