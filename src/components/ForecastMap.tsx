"use client";

import { MapContainer, TileLayer, CircleMarker, Polyline } from "react-leaflet";
import type { HeatNetworkData } from "./HeatNetworkMap";

const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Predicted congestion 0..1 -> green..red
function predColor(v: number): string {
  if (v <= 0.3) return "#22c55e";
  if (v <= 0.45) return "#84cc16";
  if (v <= 0.6) return "#eab308";
  if (v <= 0.75) return "#f97316";
  return "#ef4444";
}

export default function ForecastMap({
  network,
  predictions,
  height = 500,
}: {
  network: HeatNetworkData;
  predictions: Record<string, number>;
  height?: number;
}) {
  const byId = new Map(network.nodes.map((n) => [n.id, n]));
  const avgLat = network.nodes.reduce((s, n) => s + n.lat, 0) / network.nodes.length;
  const avgLng = network.nodes.reduce((s, n) => s + n.lng, 0) / network.nodes.length;

  return (
    <MapContainer center={[avgLat, avgLng]} zoom={14}
      style={{ height: `${height}px`, width: "100%", borderRadius: "0.5rem" }} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {network.edges.map((e, i) => {
        const a = byId.get(e.from), b = byId.get(e.to);
        if (!a || !b) return null;
        const v = predictions[ek(e.from, e.to)] ?? 0;
        return (
          <Polyline key={i} positions={[[a.lat, a.lng], [b.lat, b.lng]]}
            pathOptions={{ color: predColor(v), weight: 3 + v * 5, opacity: 0.85 }} />
        );
      })}
      {network.nodes.map((n) => (
        <CircleMarker key={n.id} center={[n.lat, n.lng]} radius={3}
          pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 1 }} />
      ))}
    </MapContainer>
  );
}
