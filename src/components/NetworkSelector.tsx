"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Item = { id: string; label: string; grid_size: number; is_active: boolean };

export function NetworkSelector({ networks }: { networks: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function select(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/network/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ networkId: id }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Failed to switch");
      else router.refresh();
    } catch (e) {
      setError("Request failed: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!networks.length) {
    return (
      <p className="text-sm text-slate-400">
        No networks yet — generate one above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {networks.map((n) => (
        <div
          key={n.id}
          className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 p-3"
        >
          <div className="font-mono text-sm text-slate-200">
            <span className="font-medium text-slate-100">{n.label}</span>
            <span className="text-slate-500">
              {" "}
              · {n.grid_size === 0 ? "real OSM" : `${n.grid_size}×${n.grid_size} grid`}
            </span>
          </div>
          {n.is_active ? (
            <span className="rounded border border-cyan-800 bg-cyan-950/40 px-2 py-1 font-mono text-xs font-medium text-cyan-300">
              Active
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => select(n.id)}
              disabled={busy === n.id}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
            >
              {busy === n.id ? "Switching…" : "Set active"}
            </Button>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
