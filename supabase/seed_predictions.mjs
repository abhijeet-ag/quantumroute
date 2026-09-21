// Seed ML congestion predictions into Supabase.
// Run from project root (after ml/cp/predict.py): node supabase/seed_predictions.mjs
// Reads ml/cp/predictions.json, attaches to the active OSM (CP) network.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing Supabase creds in .env.local"); process.exit(1); }

  const data = JSON.parse(fs.readFileSync("ml/cp/predictions.json", "utf8"));
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // Attach to the active OSM network (grid_size = 0 = CP).
  const { data: net, error: netErr } = await admin
    .from("networks").select("id, label").eq("grid_size", 0).maybeSingle();
  if (netErr || !net) { console.error("No OSM network found:", netErr?.message); process.exit(1); }
  console.log("Target network:", net.label, net.id);

  const slotLabel = Object.fromEntries(data.slots.map((s) => [s.id, s.label]));
  const batchAt = new Date().toISOString();

  // Clear old predictions for this network, then insert fresh.
  const { error: delErr } = await admin.from("predictions").delete().eq("network_id", net.id);
  if (delErr) { console.error("Delete failed:", delErr.message); process.exit(1); }

  const rows = [];
  for (const [slotId, segs] of Object.entries(data.predictions)) {
    for (const [segKey, val] of Object.entries(segs)) {
      rows.push({
        network_id: net.id,
        time_slot: slotId,
        slot_label: slotLabel[slotId] ?? slotId,
        segment_key: segKey,
        predicted: val,
        batch_at: batchAt,
      });
    }
  }

  // Insert in chunks (Supabase caps payload size).
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await admin.from("predictions").insert(rows.slice(i, i + CHUNK));
    if (error) { console.error("Insert failed:", error.message); process.exit(1); }
  }

  console.log(`Seeded ${rows.length} predictions across ${data.slots.length} slots. batch_at=${batchAt}`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
