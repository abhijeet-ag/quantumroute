import { createClient } from "@/lib/supabase/server";

export type RunRow = {
  id: string;
  vehicle_count: number;
  baseline_total_time: number;
  optimized_total_time: number;
  time_saved: number;
  congestion_reduction: number;
  vehicles_rerouted: number;
  baseline_routes: number[][];
  optimized_routes: number[][];
  created_at: string;
};

// The most recent run (for the map + metric panel), or null.
export async function fetchLatestRun(networkId?: string): Promise<RunRow | null> {
  const supabase = createClient();
  let q = supabase.from("runs").select("*");
  if (networkId) q = q.eq("network_id", networkId);
  const { data } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as RunRow) ?? null;
}

// Recent runs for the trend chart (oldest→newest of the last N).
export async function fetchRecentRuns(networkId?: string, limit = 8): Promise<RunRow[]> {
  const supabase = createClient();
  let q = supabase.from("runs").select("*");
  if (networkId) q = q.eq("network_id", networkId);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  const rows = (data as RunRow[]) ?? [];
  return rows.reverse();
}
