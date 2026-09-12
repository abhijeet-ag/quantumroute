import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  let body: { networkId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.networkId) {
    return NextResponse.json({ error: "Missing networkId" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Clear all, then set the chosen one active (single-active invariant).
  const { error: clearErr } = await admin
    .from("networks")
    .update({ is_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (clearErr) {
    return NextResponse.json({ error: clearErr.message }, { status: 500 });
  }

  const { error: setErr } = await admin
    .from("networks")
    .update({ is_active: true })
    .eq("id", body.networkId);
  if (setErr) {
    return NextResponse.json({ error: setErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
