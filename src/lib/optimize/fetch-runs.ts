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
export async function fetchLatestRun(): Promise<RunRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as RunRow) ?? null;
}

// Recent runs for the trend chart (oldest→newest of the last N).
export async function fetchRecentRuns(limit = 8): Promise<RunRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data as RunRow[]) ?? [];
  return rows.reverse();
}
