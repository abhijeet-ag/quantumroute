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
        router.refresh(); // re-render server components (map picks up new network)
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
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "Generate Network"}
        </Button>
      </div>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
