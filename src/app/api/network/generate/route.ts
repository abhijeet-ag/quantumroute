import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNetwork, PRESETS, type PresetKey } from "@/lib/network/generate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  let body: { preset?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const presetKey = body.preset as PresetKey;
  if (!presetKey || !(presetKey in PRESETS)) {
    return NextResponse.json({ error: "Unknown preset" }, { status: 400 });
  }
  const preset = PRESETS[presetKey];
  const network = generateNetwork(preset.gridSize);
  const admin = createAdminClient();

  // Delete existing SYNTHETIC networks only (grid_size > 0). The OSM network
  // (grid_size = 0) is preserved so the admin can switch back to it.
  const { error: delError } = await admin
    .from("networks")
    .delete()
    .gt("grid_size", 0);
  if (delError) {
    return NextResponse.json(
      { error: "Failed clearing old grid: " + delError.message },
      { status: 500 }
    );
  }

  // New network becomes active: clear others' flag, insert this one as active.
  await admin
    .from("networks")
    .update({ is_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: inserted, error: insError } = await admin
    .from("networks")
    .insert({
      label: preset.label,
      grid_size: preset.gridSize,
      nodes: network.nodes,
      edges: network.edges,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (insError) {
    return NextResponse.json(
      { error: "Failed saving network: " + insError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ network: inserted });
}
