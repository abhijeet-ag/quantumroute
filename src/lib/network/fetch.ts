import { createClient } from "@/lib/supabase/server";
import type { NetworkData } from "@/components/NetworkMap";

// Fetch the single active demo network (most recent), or null if none exists.
export async function fetchActiveNetwork(): Promise<NetworkData | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("networks")
    .select("label, grid_size, nodes, edges")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as NetworkData) ?? null;
}
