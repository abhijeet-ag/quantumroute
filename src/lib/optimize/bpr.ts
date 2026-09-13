// BPR cost — SINGLE SOURCE for validation page. Constants MUST match engine.ts.
export const CAPACITY = 3;
export const BPR_ALPHA = 0.15;
export const BPR_BETA = 4;

export const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export type Edge = { from: number; to: number; weight: number };

// Per-segment breakdown for a set of routes, plus total.
export type SegmentCost = {
  key: string;
  freeFlow: number;
  load: number;
  ratio: number;
  cost: number;
};

export function segmentCosts(routes: number[][], edges: Edge[]) {
  const edgeWeight = new Map<string, number>();
  for (const e of edges) edgeWeight.set(ek(e.from, e.to), e.weight);

  const load = new Map<string, number>();
  for (const path of routes) {
    for (let i = 0; i < path.length - 1; i++) {
      const key = ek(path[i], path[i + 1]);
      load.set(key, (load.get(key) || 0) + 1);
    }
  }

  const rows: SegmentCost[] = [];
  let total = 0;
  for (const [key, l] of Array.from(load)) {
    const ff = edgeWeight.get(key) ?? 0;
    const ratio = l / CAPACITY;
    const unitCost = ff * (1 + BPR_ALPHA * Math.pow(ratio, BPR_BETA));
    // Server sums cost once PER VEHICLE traversing the segment, so the segment's
    // total contribution is unitCost * load. Match that exactly.
    const cost = unitCost * l;
    rows.push({ key, freeFlow: ff, load: l, ratio, cost });
    total += cost;
  }
  rows.sort((a, b) => b.cost - a.cost);
  return { rows, total };
}
