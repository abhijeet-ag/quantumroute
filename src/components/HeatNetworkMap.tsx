"use client";

import { MapContainer, TileLayer, CircleMarker, Polyline } from "react-leaflet";

type NetworkNode = { id: number; lat: number; lng: number };
type NetworkEdge = { from: number; to: number; weight: number };

export type HeatNetworkData = {
  label: string;
  grid_size: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

const CAPACITY = 3;
const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Build per-edge load from a set of routes.
function computeLoads(routes: number[][]): Map<string, number> {
  const load = new Map<string, number>();
  for (const path of routes) {
    for (let i = 0; i < path.length - 1; i++) {
      const key = ek(path[i], path[i + 1]);
      load.set(key, (load.get(key) || 0) + 1);
    }
  }
  return load;
}

// Green (low) → amber → red (high), based on load / capacity.
function loadColor(load: number): string {
  if (load === 0) return "#cbd5e1"; // unused: light grey
  const ratio = load / CAPACITY;
  if (ratio <= 0.66) return "#22c55e"; // green
  if (ratio <= 1) return "#84cc16"; // yellow-green
  if (ratio <= 1.66) return "#eab308"; // amber
  if (ratio <= 2.66) return "#f97316"; // orange
  return "#ef4444"; // red — badly over capacity
}

export default function HeatNetworkMap({
  network,
  routes,
}: {
  network: HeatNetworkData;
  routes: number[][] | null;
}) {
  const nodeById = new Map(network.nodes.map((n) => [n.id, n]));
  const loads = routes ? computeLoads(routes) : new Map<string, number>();

  const avgLat =
    network.nodes.reduce((s, n) => s + n.lat, 0) / network.nodes.length;
  const avgLng =
    network.nodes.reduce((s, n) => s + n.lng, 0) / network.nodes.length;

  return (
    <MapContainer
      center={[avgLat, avgLng]}
      zoom={14}
      style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {network.edges.map((e, i) => {
        const a = nodeById.get(e.from);
        const b = nodeById.get(e.to);
        if (!a || !b) return null;
        const load = loads.get(ek(e.from, e.to)) || 0;
        return (
          <Polyline
            key={i}
            positions={[
              [a.lat, a.lng],
              [b.lat, b.lng],
            ]}
            pathOptions={{
              color: routes ? loadColor(load) : "#64748b",
              weight: routes && load > 0 ? 3 + Math.min(load, 8) : 3,
              opacity: 0.8,
            }}
          />
        );
      })}
      {network.nodes.map((n) => (
        <CircleMarker
          key={n.id}
          center={[n.lat, n.lng]}
          radius={4}
          pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 1 }}
        />
      ))}
    </MapContainer>
  );
}
