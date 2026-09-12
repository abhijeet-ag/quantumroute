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
      <p className="text-sm text-muted-foreground">
        No networks yet — generate one above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {networks.map((n) => (
        <div
          key={n.id}
          className="flex items-center justify-between rounded-md border bg-background p-3"
        >
          <div className="text-sm">
            <span className="font-medium">{n.label}</span>
            <span className="text-muted-foreground">
              {" "}
              · {n.grid_size === 0 ? "real OSM" : `${n.grid_size}×${n.grid_size} grid`}
            </span>
          </div>
          {n.is_active ? (
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Active
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => select(n.id)}
              disabled={busy === n.id}
            >
              {busy === n.id ? "Switching…" : "Set active"}
            </Button>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
