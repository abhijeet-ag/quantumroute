# QuantumRoute — Architecture

**Smart India Hackathon 2026 · Problem Statement SIH26137**
*Quantum-Inspired Intelligent Traffic Route Optimization in Transportation
Systems Using Metaheuristic Optimization*

---

## 1. The problem, in one paragraph

Standard navigation (Google Maps style) optimizes one vehicle's route at a time —
each driver independently takes their own shortest path. When thousands of drivers
all make that same locally-optimal choice, they crowd onto the same attractive
roads and the network as a whole stays congested. QuantumRoute treats **all
vehicles in a zone as one combined optimization problem** and solves it with a
quantum-inspired metaheuristic (simulated annealing over a QUBO-style congestion
cost), producing a coordinated routing that lowers *total* network travel time.
The tool shows standard routing vs. optimized routing side by side, with hard
metrics proving the improvement.

"Quantum-inspired" refers to the *algorithm*, not hardware: simulated annealing
borrows quantum-annealing ideas (probabilistic acceptance of worse states, gradual
cooling) and is a standard classical stand-in. The app labels all data as
simulated. No quantum hardware is involved.

---

## 2. System overview

The whole product is **ONE Next.js 14 application** deployed to **Vercel**, talking
to **ONE external service, Supabase** (Postgres + Auth + auto-generated API). No
separate backend, no second host. This was a deliberate constraint: the team keeps
the moving parts minimal so there is nothing to debug across services.

A separate, offline **Python ML pipeline** (`ml/`) trains a short-term congestion
predictor. It is standalone in this pass — not wired into the web app — and exists
as a reviewable, retrainable artifact.

```
                          +---------------------------------------------+
                          |              VERCEL (one app)               |
                          |                                             |
   Browser                |   Next.js 14 App Router (TypeScript)        |
   +------------+         |   +-------------------------------------+   |
   | Login      |<------->|   | Server + client components          |   |
   | Dashboard  |         |   |  - Leaflet heat map (OSM tiles)     |   |
   | Admin      |         |   |  - Recharts trend chart             |   |
   | (heat map, |         |   |  - shadcn/ui controls, tabs         |   |
   |  metrics,  |         |   +--------------+----------------------+   |
   |  chart)    |         |                  | calls                    |
   +------------+         |   +--------------v----------------------+   |
                          |   | Route Handlers (/app/api/...)       |   |
                          |   |  - /api/network/generate  (admin)   |   |
                          |   |  - /api/optimize          (any auth)|   |
                          |   +--------------+----------------------+   |
                          |   +--------------v----------------------+   |
                          |   | Optimization engine (/lib/optimize) |   |
                          |   |  - Dijkstra + Yen k-shortest-paths  |   |
                          |   |  - BPR congestion model             |   |
                          |   |  - Simulated annealing              |   |
                          |   +--------------+----------------------+   |
                          +------------------+--------------------------+
                                             | Supabase JS client
                                             v
                          +---------------------------------------------+
                          |                 SUPABASE                    |
                          |  Postgres     Auth        Row-Level         |
                          |  +---------+ +--------+   Security +        |
                          |  |networks | | users  |   base GRANTs       |
                          |  |vehicles | |profiles|   (both enforced)   |
                          |  | runs    | | (role) |                     |
                          |  +---------+ +--------+                     |
                          +---------------------------------------------+

   -- Standalone, offline, NOT wired into the web app in this pass --
   +---------------------------------------------+
   |  ml/  (Python)                              |
   |   python train.py  ->  synthetic data  ->   |
   |   XGBoost congestion model  ->              |
   |   model/congestion_model.joblib + metrics   |
   +---------------------------------------------+
```

## 3. Data flow, end to end

```
  Admin picks a preset (Small / Medium / Large) and clicks "Generate Network"
            |
            v
  [/api/network/generate]  builds an NxN grid graph with weighted road
            |               segments; verifies caller is admin; replaces any
            |               existing network (cascade clears old vehicles/runs);
            |               saves to Supabase `networks`
            v
  Operator or Admin clicks "Run Optimization"
            |
            v
  [/api/optimize]  loads the active network; generates fresh vehicle demand
            |        (random O->D pairs, new seed each run); then runs BOTH on
            |        the SAME vehicle set:
            |          (a) Baseline  = each vehicle's shortest path (Dijkstra)
            |          (b) Optimized = simulated annealing over the joint
            |              congestion-aware cost (k-shortest-paths per vehicle)
            |        computes metrics; saves vehicles + a `runs` row
            v
  Dashboard reads the latest run + recent runs and renders:
            - heat map colored by per-segment load (Baseline vs Optimized toggle)
            - metric cards: congestion reduction %, time saved, vehicles rerouted
            - Recharts trend: baseline vs optimized congestion across recent runs
```

## 4. The optimization method

**Candidate routes.** For each vehicle we precompute its *k* shortest loopless
paths (Yen's algorithm, k=3) between origin and destination. The optimizer chooses
which of its k routes each vehicle takes. This is the standard practical QUBO-style
formulation: a bounded set of binary choices per vehicle.

**Congestion cost (BPR).** Each road segment has a free-flow travel time (its
weight) and a capacity. As the number of vehicles on a segment rises, its travel
time rises via the Bureau of Public Roads function:

```
  segment_time = free_flow * (1 + alpha * (load / capacity)^beta)
```

with standard coefficients alpha=0.15, beta=4, and capacity=3 (tuned so all three
presets show meaningful congestion — a lower capacity models busier streets). The
total network cost is the sum over all segments of segment_time x its use.

**Baseline vs optimized.** Baseline = every vehicle on its own shortest path
(ignores the congestion others cause). Optimized = simulated annealing searches
route-assignment vectors, accepting worse states early (high "temperature") and
getting pickier as it cools, to minimize the *joint* congestion cost. The
difference between the two is the improvement we display.

**Fairness of the comparison.** Within a single run, baseline and optimized use the
*identical* vehicle set — same origins, destinations, and demand. The only thing
that changes is the routing strategy. This makes it a controlled A/B comparison.
Between runs, the demand seed changes (modeling different days' traffic), which is
what gives the trend chart natural variation.

## 5. Honest framing (for judges / reviewers)

- **Percentages are large (often 40-75%).** This is because the BPR penalty is
  quartic - congestion cost rises steeply once roads are loaded - so coordinated
  routing that relieves the worst corridors yields outsized gains. These are
  results on a synthetic demo network (clearly labeled), not real-world field
  numbers.
- **The optimized map still shows some busy segments.** The optimizer reduces
  congestion *severity* (it roughly halves the worst corridor's load by spreading
  traffic across more roads), not the raw count of busy segments. "We don't
  eliminate congestion; we ease the worst bottlenecks, which is where the time
  saving comes from."
- **Everything is seeded/reproducible.** A given run is deterministic; the
  per-run demand seed is the only intended source of between-run variation.

## 6. Scale ceiling (deliberate)

Presets cap at 8x8 / 60 vehicles. Vercel free-tier route handlers time out around
10 seconds; a fixed annealing budget on the largest preset finishes in well under
one second in practice, with large margin. Beyond 8x8 the joint anneal would need a
much larger budget to stay good, risking timeouts we cannot debug in a live demo. A
reliable small demo beats an ambitious one that stalls. Larger networks are a Phase
2 item.

## 7. Roles

Two roles, no more:
- **Admin** - generate/replace the demo network, choose the preset, trigger
  traffic generation. Can also run optimization.
- **Operator** - view the dashboard and trigger optimization only.

Roles live in a Supabase `profiles` table (one row per user, `role` column),
created automatically by a database trigger on signup. Everyone signs up as
**Operator**; an Admin is promoted with one SQL statement (see
SETUP_INSTRUCTIONS.md). Supabase Auth handles identity; we only read the role and
enforce it with Row-Level Security + a server-side check in write routes.

## 8. Security model (important nuance)

Supabase access requires **two** things, and we set both:
1. **Base table GRANTs** to the `authenticated` and `service_role` Postgres roles.
   Tables created via raw SQL do NOT get these automatically.
2. **Row-Level Security policies** on top, deciding which rows each role may touch.

RLS is checked *on top of* grants, not instead of them - miss the grant and every
query is denied even with a correct policy. Write routes (network generation) also
re-verify the caller's admin role on the server before using the service-role
client, so the UI guard is convenience and the server check is the real gate.

## 9. Environment variables

| Variable | What it is | Where to get it | Secret? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | Supabase -> Project Settings -> API -> Project URL | No (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key the browser uses (RLS protects data) | Supabase -> Project Settings -> API -> anon public | No (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key used ONLY in server API routes for privileged writes; never exposed to the browser | Supabase -> Project Settings -> API -> service_role | **YES - keep secret** |

`NEXT_PUBLIC_`-prefixed vars are readable in the browser by design. The service-role
key deliberately has no such prefix, keeping it server-only. Never add the prefix
to it.

## 10. The ML pipeline (standalone)

`ml/train.py` runs the whole thing with one command: it generates a synthetic
congestion dataset, trains an XGBoost regressor to predict near-term congestion,
evaluates it (MAE / RMSE / R2), and saves `model/congestion_model.joblib` plus
`model/metrics.json`. It is not wired into the web app in this pass. See
`ml/DATA_ASSUMPTIONS.md` for what the synthetic data assumes and how to substitute
a real dataset.

## 11. Tech stack

- Framework: Next.js 14 (App Router), TypeScript
- UI: Tailwind CSS v3 + shadcn/ui, Recharts
- Map: Leaflet + react-leaflet 4 + OpenStreetMap tiles (no API key)
- DB + Auth: Supabase (Postgres, Auth, RLS)
- Deploy: Vercel
- ML: Python, XGBoost, scikit-learn, pandas, joblib

## 12. Phase 2 ideas (NOT built now - parked on purpose)

- Live OpenStreetMap import of a real neighbourhood instead of a synthetic grid.
- Wiring the ML congestion predictor into the live app to warm-start the optimizer.
- Larger networks via a hierarchical / zoned solve to stay under timeouts.
- Automatic periodic re-optimization instead of a manual button.
- Time-of-day demand profiles instead of uniform random demand.
- Quantum-behaved PSO as an alternative optimizer to compare against annealing.
