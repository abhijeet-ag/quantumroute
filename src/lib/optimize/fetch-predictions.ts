import { createClient } from "@/lib/supabase/server";

export type PredictionSlot = { time_slot: string; slot_label: string };
export type PredictionData = {
  slots: PredictionSlot[];
  batchAt: string | null;
  bySlot: Record<string, Record<string, number>>; // slot -> segment_key -> predicted
};

export async function fetchPredictions(networkId?: string): Promise<PredictionData | null> {
  if (!networkId) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("predictions")
    .select("time_slot, slot_label, segment_key, predicted, batch_at")
    .eq("network_id", networkId);
  if (!data || data.length === 0) return null;

  const bySlot: Record<string, Record<string, number>> = {};
  const slotMap: Record<string, string> = {};
  let batchAt: string | null = null;
  for (const r of data) {
    (bySlot[r.time_slot] ??= {})[r.segment_key] = r.predicted as number;
    slotMap[r.time_slot] = r.slot_label as string;
    if (!batchAt || (r.batch_at as string) > batchAt) batchAt = r.batch_at as string;
  }
  // Order slots by mean prediction (calm -> busy) for a sensible selector order.
  const slots = Object.keys(slotMap)
    .map((id) => ({ time_slot: id, slot_label: slotMap[id] }))
    .sort((a, b) => {
      const ma = avg(bySlot[a.time_slot]);
      const mb = avg(bySlot[b.time_slot]);
      return ma - mb;
    });
  return { slots, batchAt, bySlot };
}

function avg(m: Record<string, number>) {
  const v = Object.values(m);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
