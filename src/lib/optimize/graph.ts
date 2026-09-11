// Graph utilities: adjacency, Dijkstra, k-shortest-paths (Yen's algorithm).

export type Node = { id: number; lat: number; lng: number };
export type Edge = { from: number; to: number; weight: number };
export type PathResult = { path: number[]; cost: number };

export function buildAdjacency(nodes: Node[], edges: Edge[]) {
  const adj = new Map<number, { to: number; weight: number }[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to, weight: e.weight });
    adj.get(e.to)!.push({ to: e.from, weight: e.weight });
  }
  return adj;
}

type Adj = Map<number, { to: number; weight: number }[]>;

export function dijkstra(
  adj: Adj,
  source: number,
  target: number,
  removedEdges: Set<string> = new Set(),
  removedNodes: Set<number> = new Set()
): PathResult | null {
  const dist = new Map<number, number>();
  const prev = new Map<number, number>();
  const visited = new Set<number>();
  dist.set(source, 0);
  const pq: { node: number; d: number }[] = [{ node: source, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { node } = pq.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    if (node === target) break;
    for (const { to, weight } of adj.get(node) || []) {
      if (removedNodes.has(to)) continue;
      const edgeKey = node < to ? `${node}-${to}` : `${to}-${node}`;
      if (removedEdges.has(edgeKey)) continue;
      const nd = (dist.get(node) ?? Infinity) + weight;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, node);
        pq.push({ node: to, d: nd });
      }
    }
  }
  if (!dist.has(target)) return null;
  const path: number[] = [];
  let cur: number | undefined = target;
  while (cur !== undefined) {
    path.unshift(cur);
    if (cur === source) break;
    cur = prev.get(cur);
    if (cur === undefined) return null;
  }
  return { path, cost: dist.get(target)! };
}

function pathCost(adj: Adj, path: number[]): number {
  let c = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = (adj.get(path[i]) || []).find((e) => e.to === path[i + 1]);
    if (!edge) return Infinity;
    c += edge.weight;
  }
  return c;
}

const pathKey = (p: number[]) => p.join(",");

export function kShortestPaths(
  adj: Adj,
  source: number,
  target: number,
  K = 3
): PathResult[] {
  const first = dijkstra(adj, source, target);
  if (!first) return [];
  const A: PathResult[] = [first];
  const B: PathResult[] = [];
  for (let k = 1; k < K; k++) {
    const prevPath = A[k - 1].path;
    for (let i = 0; i < prevPath.length - 1; i++) {
      const spurNode = prevPath[i];
      const rootPath = prevPath.slice(0, i + 1);
      const removedEdges = new Set<string>();
      const removedNodes = new Set<number>();
      for (const p of A) {
        if (
          p.path.length > i &&
          pathKey(p.path.slice(0, i + 1)) === pathKey(rootPath)
        ) {
          const a = p.path[i], b = p.path[i + 1];
          removedEdges.add(a < b ? `${a}-${b}` : `${b}-${a}`);
        }
      }
      for (const rn of rootPath.slice(0, -1)) removedNodes.add(rn);
      const spur = dijkstra(adj, spurNode, target, removedEdges, removedNodes);
      if (spur) {
        const total = rootPath.slice(0, -1).concat(spur.path);
        const candidate = { path: total, cost: pathCost(adj, total) };
        if (
          !B.find((x) => pathKey(x.path) === pathKey(candidate.path)) &&
          !A.find((x) => pathKey(x.path) === pathKey(candidate.path))
        ) {
          B.push(candidate);
        }
      }
    }
    if (!B.length) break;
    B.sort((a, b) => a.cost - b.cost);
    A.push(B.shift()!);
  }
  return A;
}
