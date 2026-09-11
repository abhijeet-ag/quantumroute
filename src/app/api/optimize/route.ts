import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVehicles, optimize } from "@/lib/optimize/engine";
import { vehicleCountForLabel } from "@/lib/optimize/presets";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Load the active network.
  const { data: network } = await supabase
    .from("networks")
    .select("id, label, grid_size, nodes, edges")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!network) {
    return NextResponse.json({ error: "No network exists yet" }, { status: 400 });
  }

  // Generate demand for this network's preset.
  const vehicleCount = vehicleCountForLabel(network.label);
  const vehicles = generateVehicles(network.nodes, vehicleCount);

  // Run baseline + optimizer.
  const result = optimize(network.nodes, network.edges, vehicles, {
    iterations: 8000,
  });

  // Persist: replace this network's vehicles, then save a run.
  const admin = createAdminClient();

  await admin.from("vehicles").delete().eq("network_id", network.id);
  await admin.from("vehicles").insert(
    vehicles.map((v) => ({
      network_id: network.id,
      origin: v.origin,
      destination: v.destination,
    }))
  );

  const { data: run, error: runErr } = await admin
    .from("runs")
    .insert({
      network_id: network.id,
      vehicle_count: vehicleCount,
      baseline_total_time: result.baselineTotalTime,
      optimized_total_time: result.optimizedTotalTime,
      time_saved: result.timeSaved,
      congestion_reduction: result.congestionReduction,
      vehicles_rerouted: result.vehiclesRerouted,
      baseline_routes: result.baselineRoutes,
      optimized_routes: result.optimizedRoutes,
      created_by: user.id,
    })
    .select()
    .single();

  if (runErr) {
    return NextResponse.json(
      { error: "Failed saving run: " + runErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ run });
}
