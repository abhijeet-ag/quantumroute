import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNetwork, PRESETS, type PresetKey } from "@/lib/network/generate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. Who is calling? (uses the session cookie)
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // 2. Are they an admin? Read their role (RLS lets a user read their own row).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  // 3. Which preset?
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

  // 4. Build the network (pure function).
  const network = generateNetwork(preset.gridSize);

  // 5. Save it with the admin client. We keep ONE demo network at a time:
  //    delete existing networks first, then insert the new one.
  const admin = createAdminClient();

  const { error: delError } = await admin
    .from("networks")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows
  if (delError) {
    return NextResponse.json(
      { error: "Failed clearing old network: " + delError.message },
      { status: 500 }
    );
  }

  const { data: inserted, error: insError } = await admin
    .from("networks")
    .insert({
      label: preset.label,
      grid_size: preset.gridSize,
      nodes: network.nodes,
      edges: network.edges,
      created_by: user.id,
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
