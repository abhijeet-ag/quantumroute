// Synthetic road-network generator: builds an N×N grid graph laid out
// over a small geographic area, with realistic-looking road weights.
// Pure function — no browser, no database. Deterministic given a seed.

export type NetworkNode = {
  id: number;
  x: number; // grid column (0..N-1)
  y: number; // grid row (0..N-1)
  lat: number;
  lng: number;
};

export type NetworkEdge = {
  from: number; // node id
  to: number; // node id
  weight: number; // travel time / cost for this segment
};

export type Network = {
  gridSize: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

// Simple seeded pseudo-random generator so networks are reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Center of the demo map (Delhi). The grid is a small overlay near here.
const CENTER_LAT = 28.6139;
const CENTER_LNG = 77.209;
// How far apart grid nodes sit, in degrees (~0.008° ≈ 0.9 km).
const SPACING = 0.008;

export function generateNetwork(gridSize: number, seed = 42): Network {
  const rand = mulberry32(seed);
  const nodes: NetworkNode[] = [];

  // Offset so the grid is centered on CENTER_LAT/LNG.
  const half = (gridSize - 1) / 2;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const id = y * gridSize + x;
      nodes.push({
        id,
        x,
        y,
        lat: CENTER_LAT + (half - y) * SPACING,
        lng: CENTER_LNG + (x - half) * SPACING,
      });
    }
  }

  // Edges connect each node to its right and bottom neighbor (undirected grid).
  const edges: NetworkEdge[] = [];
  const addEdge = (from: number, to: number) => {
    // Base weight ~10, plus random variation so some roads are "slower".
    const weight = Math.round((10 + rand() * 10) * 10) / 10;
    edges.push({ from, to, weight });
  };

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const id = y * gridSize + x;
      if (x < gridSize - 1) addEdge(id, id + 1); // right neighbor
      if (y < gridSize - 1) addEdge(id, id + gridSize); // bottom neighbor
    }
  }

  return { gridSize, nodes, edges };
}

// Preset definitions — bounded to stay timeout-safe.
export const PRESETS = {
  small: { label: "Small (6×6, 20 vehicles)", gridSize: 6, vehicles: 20 },
  medium: { label: "Medium (8×8, 40 vehicles)", gridSize: 8, vehicles: 40 },
  large: { label: "Large (8×8, 60 vehicles)", gridSize: 8, vehicles: 60 },
} as const;

export type PresetKey = keyof typeof PRESETS;
