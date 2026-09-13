"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRESET_OPTIONS = [
  { key: "small", label: "Small (6×6, 20 vehicles)" },
  { key: "medium", label: "Medium (8×8, 40 vehicles)" },
  { key: "large", label: "Large (8×8, 60 vehicles)" },
];

export function GenerateNetworkControl() {
  const router = useRouter();
  const [preset, setPreset] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/network/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setMessage(
          `Network generated: ${data.network.label} (${data.network.grid_size}×${data.network.grid_size}).`
        );
        router.refresh();
      }
    } catch (e) {
      setError("Request failed: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="w-64 border-slate-700 bg-slate-950 text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
            {PRESET_OPTIONS.map((o) => (
              <SelectItem
                key={o.key}
                value={o.key}
                className="text-slate-100 focus:bg-slate-800 focus:text-slate-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        >
          {loading ? "Generating…" : "Generate Network"}
        </Button>
      </div>
      {message && <p className="text-sm text-cyan-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
