import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { EquilibriumView } from "@/components/EquilibriumView";
import { fetchActiveNetwork } from "@/lib/network/fetch";

export default async function EquilibriumPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("email, role").eq("id", user.id).single();

  // The equilibrium data is precomputed for the CP network; we still need the
  // network geometry (nodes/edges) to draw the flow map. Fall back gracefully.
  const network = await fetchActiveNetwork();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AppHeader email={profile?.email ?? user.email} role={profile?.role} />
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
          <h1 className="text-2xl font-bold text-slate-100">
            Dynamic Equilibrium — iterative traffic assignment
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            A dynamic-weight solve where edge travel times update with congestion each iteration,
            converging to Wardrop user-equilibrium. Complementary to the one-shot metaheuristic:
            slower, but the rigorous equilibrium reference. Precomputed reference scenario —
            40 vehicles on the real Connaught Place network.
          </p>
        </div>
        {network ? (
          <EquilibriumView network={network} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Select the Connaught Place network on the dashboard to view the equilibrium flow map.
          </div>
        )}
      </main>
    </div>
  );
}
