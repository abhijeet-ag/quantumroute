import { createClient } from "@/lib/supabase/server";
import type { NetworkData } from "@/components/NetworkMap";

// Fetch the active demo network (is_active = true), or null if none.
export async function fetchActiveNetwork(): Promise<NetworkData | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("networks")
    .select("id, label, grid_size, nodes, edges")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return (data as NetworkData) ?? null;
}

// List all networks for the admin selector (id, label, grid_size, is_active).
export type NetworkListItem = {
  id: string;
  label: string;
  grid_size: number;
  is_active: boolean;
};

export async function listNetworks(): Promise<NetworkListItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("networks")
    .select("id, label, grid_size, is_active")
    .order("created_at", { ascending: false });
  return (data as NetworkListItem[]) ?? [];
}
