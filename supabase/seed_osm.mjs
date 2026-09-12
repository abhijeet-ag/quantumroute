// One-time seeding script: loads the cleaned Connaught Place OSM graph into
// Supabase as a network row (grid_size = 0 marks it as a real-OSM network).
// Run from project root:  node supabase/seed_osm.mjs
//
// WEIGHT NORMALIZATION (important — this is why CP and the grid are comparable):
// The synthetic grid draws each edge's free-flow time from uniform[10,20],
// giving a mean of 15. The raw OSM graph stores edge weights as scaled real
// segment lengths, with a much smaller mean (~0.9). Because our BPR congestion
// model multiplies the congestion penalty by the edge's free-flow time, the two
// networks must be on the same scale for the congestion comparison to be
// apples-to-apples. We therefore normalize CP's weights so their MEAN equals the
// synthetic network's mean free-flow time (15). This is a units normalization,
// not tuning — both networks then use the identical congestion model and the
// identical capacity (3). Documented in ARCHITECTURE.md.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SYNTHETIC_MEAN_FREEFLOW = 15; // mean of uniform[10,20], the grid's scale

function loadEnv() {
  const env = {};
  const raw = fs.readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const graph = JSON.parse(
    fs.readFileSync("supabase/seed-data/cnp_clean_600.json", "utf8")
  );

  // Normalize edge weights so their mean matches the synthetic grid's mean.
  const rawMean =
    graph.edges.reduce((a, e) => a + e.weight, 0) / graph.edges.length;
  const factor = SYNTHETIC_MEAN_FREEFLOW / rawMean;
  const normalizedEdges = graph.edges.map((e) => ({
    ...e,
    weight: Math.round(e.weight * factor * 10) / 10,
  }));
  const newMean =
    normalizedEdges.reduce((a, e) => a + e.weight, 0) / normalizedEdges.length;

  console.log(`Graph: ${graph.node_count} nodes, ${graph.edge_count} edges`);
  console.log(
    `Normalization: raw mean ${rawMean.toFixed(2)} x ${factor.toFixed(
      1
    )} -> ${newMean.toFixed(1)} (target ${SYNTHETIC_MEAN_FREEFLOW})`
  );

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Replace any existing OSM network (grid_size = 0); leave grids untouched.
  const { error: delErr } = await admin.from("networks").delete().eq("grid_size", 0);
  if (delErr) { console.error("Delete failed:", delErr.message); process.exit(1); }

  const { data, error } = await admin
    .from("networks")
    .insert({
      label: graph.label,
      grid_size: 0,
      nodes: graph.nodes,
      edges: normalizedEdges,
    })
    .select("id, label, grid_size")
    .single();

  if (error) { console.error("Insert failed:", error.message); process.exit(1); }

  console.log("Seeded OSM network (normalized weights):");
  console.log("  id:", data.id);
  console.log("  label:", data.label);
  console.log("  grid_size:", data.grid_size, "(0 = OSM)");
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
