"""
CP-keyed synthetic congestion dataset — trains over the 149 REAL Connaught
Place segments (cp_segments.json), not abstract indices. Each real segment gets
its own popularity + rush-hour profile, so predictions map 1:1 to the
optimizer's edge keys ("min-max" of node ids, matching the app's ek()).

ASSUMPTIONS (for reviewers):
1. Daily rhythm: morning (~9) + evening (~18) Gaussian peaks, low overnight.
2. Weekend (day 5,6): lower, flatter.
3. Per-segment popularity: intrinsic busyness multiplier, seeded deterministically
   from the segment key (stable across runs).
4. Persistence: congestion correlates with previous step (lag_1).
5. Gaussian noise caps achievable accuracy (realistic; R2 lands ~0.90, not 0.99).

Substitute real data by replacing generate_dataset() with a loader returning the
same columns: seg_key, day_of_week, hour, seg_popularity, lag_1, congestion.
"""
import json
import numpy as np
import pandas as pd

def seg_key(a, b):
    return f"{min(a,b)}-{max(a,b)}"

def load_segments(path="cp_segments.json"):
    edges = json.load(open(path))
    return [seg_key(e["from"], e["to"]) for e in edges]

def _tod(hour):
    m = np.exp(-((hour-9)**2)/(2*2.0**2))
    e = np.exp(-((hour-18)**2)/(2*2.5**2))
    return np.clip(0.15 + 0.6*m + 0.7*e, 0, 1.2)

def generate_dataset(n_days=60, seed=42):
    rng = np.random.default_rng(seed)
    segs = load_segments()
    pop = {s: 0.5 + (int(__import__("hashlib").md5(s.encode()).hexdigest(),16) % 1000)/1000.0 for s in segs}
    rows = []
    prev = {s: 0.2 for s in segs}
    for day in range(n_days):
        dow = day % 7
        wk = 0.6 if dow in (5,6) else 1.0
        for hour in range(24):
            tod = _tod(hour)
            for s in segs:
                base = tod * pop[s] * wk
                persisted = 0.7*base + 0.3*prev[s]
                c = float(np.clip(persisted + rng.normal(0,0.08), 0, 1))
                rows.append({"seg_key": s, "day_of_week": dow, "hour": hour,
                             "seg_popularity": pop[s], "lag_1": prev[s], "congestion": c})
                prev[s] = c
    return pd.DataFrame(rows)

if __name__ == "__main__":
    df = generate_dataset()
    print(f"{len(df):,} rows, {df.seg_key.nunique()} segments, mean congestion {df.congestion.mean():.3f}")
