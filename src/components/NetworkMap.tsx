"use client";

import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";

type NetworkNode = { id: number; lat: number; lng: number };
type NetworkEdge = { from: number; to: number; weight: number };

export type NetworkData = {
  label: string;
  grid_size: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

export default function NetworkMap({ network }: { network: NetworkData }) {
  const nodeById = new Map(network.nodes.map((n) => [n.id, n]));

  // Center on the mean of all node coordinates.
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
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Road segments */}
      {network.edges.map((e, i) => {
        const a = nodeById.get(e.from);
        const b = nodeById.get(e.to);
        if (!a || !b) return null;
        return (
          <Polyline
            key={i}
            positions={[
              [a.lat, a.lng],
              [b.lat, b.lng],
            ]}
            pathOptions={{ color: "#64748b", weight: 3, opacity: 0.7 }}
          />
        );
      })}

      {/* Intersections */}
      {network.nodes.map((n) => (
        <CircleMarker
          key={n.id}
          center={[n.lat, n.lng]}
          radius={5}
          pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 1 }}
        >
          <Tooltip>Node {n.id}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
