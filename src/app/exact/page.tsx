import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { EXACT } from "@/lib/benchmark/exact_data";

export default async function ExactPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("email, role").eq("id", user.id).single();

  const { rows, note } = EXACT;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AppHeader email={profile?.email ?? user.email} role={profile?.role} />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 p-6">
          <h1 className="text-2xl font-bold text-slate-100">
            Exact-Solver Verification — do our solvers find the true optimum?
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            On small instances we can brute-force enumerate the entire assignment space and find the
            provable global optimum. We compare our metaheuristics against it — if they match the
            optimum, we know they are not just &ldquo;good enough,&rdquo; they are optimal where optimality
            is checkable.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="overflow-hidden rounded border border-slate-800">
            <table className="w-full font-mono text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-2 text-left">vehicles</th>
                  <th className="p-2 text-right">assignments enumerated</th>
                  <th className="p-2 text-right">exact optimum</th>
                  <th className="p-2 text-right">SA</th>
                  <th className="p-2 text-right">QPSO</th>
                  <th className="p-2 text-right">GA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.vehicles} className="border-t border-slate-800 text-slate-300">
                    <td className="p-2">{r.vehicles}</td>
                    <td className="p-2 text-right">{r.enumerated.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold text-slate-100">{r.optimum}</td>
                    <td className="p-2 text-right text-green-400">{r.sa} <span className="text-slate-500">({r.saGap}%)</span></td>
                    <td className="p-2 text-right text-green-400">{r.qpso} <span className="text-slate-500">({r.qpsoGap}%)</span></td>
                    <td className="p-2 text-right text-green-400">{r.ga} <span className="text-slate-500">({r.gaGap}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            <span className="text-green-400 font-medium">Result:</span> every metaheuristic reaches the
            proven global optimum (0% gap) on every instance. {note}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-500 font-mono">
          Note: at 6 vehicles the network is lightly loaded, so the optimum equals the baseline
          (no congestion to relieve). Improvement appears as load grows — the verification here is of
          solution <span className="text-slate-300">optimality</span>, not of savings magnitude.
        </div>
      </main>
    </div>
  );
}
