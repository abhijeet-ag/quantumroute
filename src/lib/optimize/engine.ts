// Congestion model (BPR) + simulated annealing optimizer + metrics.
import {
  buildAdjacency,
  dijkstra,
  kShortestPaths,
  type Node,
  type Edge,
  type PathResult,
} from "./graph";

export type Vehicle = { origin: number; destination: number };

export type OptimizeResult = {
  baselineTotalTime: number;
  optimizedTotalTime: number;
  timeSaved: number;
  congestionReduction: number; // percent
  vehiclesRerouted: number;
  baselineRoutes: number[][];
  optimizedRoutes: number[][];
};

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateVehicles(
  nodes: Node[],
  count: number,
  seed = 7
): Vehicle[] {
  const rand = mulberry32(seed);
  const vehicles: Vehicle[] = [];
  const n = nodes.length;
  for (let i = 0; i < count; i++) {
    let o = Math.floor(rand() * n);
    let d = Math.floor(rand() * n);
    while (d === o) d = Math.floor(rand() * n);
    vehicles.push({ origin: nodes[o].id, destination: nodes[d].id });
  }
  return vehicles;
}

const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Congestion model constants.
// CAPACITY: vehicles a segment carries before congestion rises steeply.
// BPR function: time = freeflow * (1 + alpha * (load/capacity)^beta).
// Standard Bureau of Public Roads coefficients.
const CAPACITY = 3;
const BPR_ALPHA = 0.15;
const BPR_BETA = 4;

function evaluateAssignment(
  vehicleRoutes: PathResult[][],
  assignment: number[],
  edgeWeight: Map<string, number>
) {
  const load = new Map<string, number>();
  for (let v = 0; v < assignment.length; v++) {
    const path = vehicleRoutes[v][assignment[v]].path;
    for (let i = 0; i < path.length - 1; i++) {
      const key = ek(path[i], path[i + 1]);
      load.set(key, (load.get(key) || 0) + 1);
    }
  }
  let total = 0;
  for (let v = 0; v < assignment.length; v++) {
    const path = vehicleRoutes[v][assignment[v]].path;
    for (let i = 0; i < path.length - 1; i++) {
      const key = ek(path[i], path[i + 1]);
      const ff = edgeWeight.get(key)!;
      const x = (load.get(key) || 0) / CAPACITY;
      total += ff * (1 + BPR_ALPHA * Math.pow(x, BPR_BETA));
    }
  }
  return { total, load };
}

export function optimize(
  nodes: Node[],
  edges: Edge[],
  vehicles: Vehicle[],
  opts: { K?: number; iterations?: number; seed?: number; cooling?: number } = {}
): OptimizeResult {
  const K = opts.K ?? 3;
  const iterations = opts.iterations ?? 8000;
  const seed = opts.seed ?? 123;
  const cooling = opts.cooling ?? 0.9995;
  const rand = mulberry32(seed);

  const adj = buildAdjacency(nodes, edges);
  const edgeWeight = new Map<string, number>();
  for (const e of edges) edgeWeight.set(ek(e.from, e.to), e.weight);

  const vehicleRoutes: PathResult[][] = vehicles.map((v) => {
    const paths = kShortestPaths(adj, v.origin, v.destination, K);
    if (paths.length) return paths;
    const single = dijkstra(adj, v.origin, v.destination);
    return single ? [single] : [{ path: [v.origin, v.destination], cost: 1 }];
  });

  const baselineAssign = vehicleRoutes.map(() => 0);
  const baselineEval = evaluateAssignment(vehicleRoutes, baselineAssign, edgeWeight);

  let current = baselineAssign.slice();
  let currentCost = baselineEval.total;
  let best = current.slice();
  let bestCost = currentCost;

  let T = currentCost / vehicles.length;

  for (let it = 0; it < iterations; it++) {
    const v = Math.floor(rand() * current.length);
    const nRoutes = vehicleRoutes[v].length;
    if (nRoutes < 2) { T *= cooling; continue; }
    const newRoute = Math.floor(rand() * nRoutes);
    if (newRoute === current[v]) { T *= cooling; continue; }

    const candidate = current.slice();
    candidate[v] = newRoute;
    const candCost = evaluateAssignment(vehicleRoutes, candidate, edgeWeight).total;
    const delta = candCost - currentCost;

    if (delta < 0 || rand() < Math.exp(-delta / Math.max(T, 1e-6))) {
      current = candidate;
      currentCost = candCost;
      if (candCost < bestCost) { best = candidate.slice(); bestCost = candCost; }
    }
    T *= cooling;
  }

  const optimizedEval = evaluateAssignment(vehicleRoutes, best, edgeWeight);
  const rerouted = best.reduce(
    (acc, r, i) => acc + (r !== baselineAssign[i] ? 1 : 0),
    0
  );
  const congestionReduction =
    baselineEval.total > 0
      ? ((baselineEval.total - optimizedEval.total) / baselineEval.total) * 100
      : 0;

  return {
    baselineTotalTime: baselineEval.total,
    optimizedTotalTime: optimizedEval.total,
    timeSaved: baselineEval.total - optimizedEval.total,
    congestionReduction,
    vehiclesRerouted: rerouted,
    baselineRoutes: baselineAssign.map((r, i) => vehicleRoutes[i][r].path),
    optimizedRoutes: best.map((r, i) => vehicleRoutes[i][r].path),
  };
}
