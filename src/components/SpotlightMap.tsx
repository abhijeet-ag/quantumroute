"use client";

import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import type { HeatNetworkData } from "./HeatNetworkMap";

export default function SpotlightMap({
  network,
  baselinePath,
  optimizedPath,
  selectedSource,
  selectedDest,
  onNodeClick,
  height = 500,
}: {
  network: HeatNetworkData;
  baselinePath: number[] | null;
  optimizedPath: number[] | null;
  selectedSource: number | null;
  selectedDest: number | null;
  onNodeClick: (nodeId: number) => void;
  height?: number;
}) {
  const byId = new Map(network.nodes.map((n) => [n.id, n]));

  const avgLat = network.nodes.reduce((s, n) => s + n.lat, 0) / network.nodes.length;
  const avgLng = network.nodes.reduce((s, n) => s + n.lng, 0) / network.nodes.length;

  const toLatLng = (path: number[]) =>
    path
      .map((id) => byId.get(id))
      .filter((n): n is NonNullable<typeof n> => !!n)
      .map((n) => [n.lat, n.lng] as [number, number]);

  const baselineCoords = baselinePath ? toLatLng(baselinePath) : [];
  const optimizedCoords = optimizedPath ? toLatLng(optimizedPath) : [];
  // Keys change whenever the path changes, forcing Leaflet to redraw the line
  // instead of keeping a stale one.
  const baselineKey = baselinePath ? "b-" + baselinePath.join("-") : "b-none";
  const optimizedKey = optimizedPath ? "o-" + optimizedPath.join("-") : "o-none";

  return (
    <MapContainer
      center={[avgLat, avgLng]}
      zoom={14}
      style={{ height: `${height}px`, width: "100%", borderRadius: "0.5rem" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Dimmed base network */}
      {network.edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        return (
          <Polyline
            key={i}
            positions={[[a.lat, a.lng], [b.lat, b.lng]]}
            pathOptions={{ color: "#94a3b8", weight: 2, opacity: 0.25 }}
          />
        );
      })}

      {/* Baseline path (red) — keyed so it always redraws for the current journey */}
      {baselineCoords.length > 1 && (
        <Polyline
          key={baselineKey}
          positions={baselineCoords}
          pathOptions={{ color: "#dc2626", weight: 6, opacity: 0.9 }}
        />
      )}
      {/* Optimized path (green), drawn on top */}
      {optimizedCoords.length > 1 && (
        <Polyline
          key={optimizedKey}
          positions={optimizedCoords}
          pathOptions={{ color: "#16a34a", weight: 4, opacity: 0.95 }}
        />
      )}

      {/* All nodes, clickable */}
      {network.nodes.map((n) => {
        const isSource = n.id === selectedSource;
        const isDest = n.id === selectedDest;
        const special = isSource || isDest;
        return (
          <CircleMarker
            key={n.id}
            center={[n.lat, n.lng]}
            radius={special ? 9 : 5}
            pathOptions={{
              color: isSource ? "#2563eb" : isDest ? "#dc2626" : "#0f172a",
              fillColor: isSource ? "#2563eb" : isDest ? "#dc2626" : "#0f172a",
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onNodeClick(n.id) }}
          >
            {special && (
              <Tooltip permanent direction="top">
                {isSource ? "Source" : "Destination"}
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
