// Journey analysis: nearest-journey matching + highest-impact tradeoff finder.
// Ported from standalone-tested logic (E2).

type Node = { id: number; lat: number; lng: number };
type Edge = { from: number; to: number; weight: number };

const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Route travel time = sum of free-flow edge weights along the path.
export function pathTime(path: number[], edges: Edge[]): number {
  const w = new Map<string, number>();
  for (const e of edges) w.set(ek(e.from, e.to), e.weight);
  let t = 0;
  for (let i = 0; i < path.length - 1; i++) t += w.get(ek(path[i], path[i + 1])) || 0;
  return t;
}

export type MatchedJourney = {
  vehicleIndex: number;
  origin: number;
  destination: number;
  baselinePath: number[];
  optimizedPath: number[];
  rerouted: boolean;
};

// Find the run's vehicle whose (origin,destination) is geographically nearest
// the two clicked nodes.
export function nearestJourney(
  clickedSource: number,
  clickedDest: number,
  nodes: Node[],
  baselineRoutes: number[][],
  optimizedRoutes: number[][]
): MatchedJourney | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const src = byId.get(clickedSource);
  const dst = byId.get(clickedDest);
  if (!src || !dst) return null;
  const d2 = (a: Node, b: Node) => (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;

  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < baselineRoutes.length; i++) {
    const o = byId.get(baselineRoutes[i][0]);
    const dd = byId.get(baselineRoutes[i][baselineRoutes[i].length - 1]);
    if (!o || !dd) continue;
    const score = d2(o, src) + d2(dd, dst);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  if (best === -1) return null;

  const baselinePath = baselineRoutes[best];
  const optimizedPath = optimizedRoutes[best];
  return {
    vehicleIndex: best,
    origin: baselinePath[0],
    destination: baselinePath[baselinePath.length - 1],
    baselinePath,
    optimizedPath,
    rerouted: baselinePath.join(",") !== optimizedPath.join(","),
  };
}

export type TradeoffJourney = {
  vehicleIndex: number;
  origin: number;
  destination: number;
  baselineTime: number;
  optimizedTime: number;
  delta: number; // optimized - baseline (positive = individually longer)
  pctLonger: number;
};

// Highest-impact tradeoff journeys: those that took an individually LONGER
// route so the network flows better. Ranked by how much longer (most sacrifice
// first). This is legitimate analysis — a traffic authority needs to know which
// journeys bear the cost of coordination.
export function highestImpactTradeoffs(
  nodes: Node[],
  edges: Edge[],
  baselineRoutes: number[][],
  optimizedRoutes: number[][]
): TradeoffJourney[] {
  const results: TradeoffJourney[] = [];
  for (let i = 0; i < baselineRoutes.length; i++) {
    const b = baselineRoutes[i];
    const o = optimizedRoutes[i];
    if (b.join(",") === o.join(",")) continue; // not rerouted
    const bt = pathTime(b, edges);
    const ot = pathTime(o, edges);
    const delta = ot - bt;
    if (delta <= 0.01) continue; // only journeys that got individually longer
    if (bt <= 0) continue; // skip malformed/zero-length baseline (no valid ratio)
    results.push({
      vehicleIndex: i,
      origin: b[0],
      destination: b[b.length - 1],
      baselineTime: bt,
      optimizedTime: ot,
      delta,
      pctLonger: (delta / bt) * 100,
    });
  }
  results.sort((a, b) => b.delta - a.delta);
  return results;
}
