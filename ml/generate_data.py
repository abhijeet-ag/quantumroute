"""
Synthetic congestion dataset generator for QuantumRoute.

WHAT THIS PRODUCES
------------------
A table where each row is: "for road segment S, at hour H, on day-of-week D,
given recent conditions, what is the congestion level in the NEXT time step?"
The model learns to predict near-term congestion from current + cyclical features.

ASSUMPTIONS (documented so ML reviewers can judge realism)
----------------------------------------------------------
1. Congestion follows a daily rhythm: two rush-hour peaks (morning ~9, evening ~18),
   low overnight. Modeled with two Gaussian bumps over the 24-hour clock.
2. Weekends (day 5,6) have lower, flatter congestion than weekdays.
3. Each road segment has an intrinsic "popularity" (some roads are always busier).
   Modeled as a per-segment base multiplier.
4. Short-term persistence: congestion now is correlated with congestion 1 step ago
   (traffic doesn't teleport). We include a lagged feature for this.
5. Noise: real traffic is noisy, so we add Gaussian noise. This caps how well ANY
   model can do — that's realistic, not a bug.

HOW TO SUBSTITUTE REAL DATA
---------------------------
Replace generate_dataset() with a loader that returns a DataFrame with the same
columns: [segment_id, hour, day_of_week, seg_popularity, lag_1, congestion].
Real sources: loop-detector counts, GPS floating-car data, or city open-data
traffic APIs, aggregated to (segment, time-bucket) with a congestion index in [0,1].
Everything downstream (features, training, evaluation) stays identical.
"""

import numpy as np
import pandas as pd


def _time_of_day_profile(hour):
    """Two rush-hour Gaussian peaks over 24h, returns baseline congestion in ~[0,1]."""
    morning = np.exp(-((hour - 9) ** 2) / (2 * 2.0 ** 2))
    evening = np.exp(-((hour - 18) ** 2) / (2 * 2.5 ** 2))
    base = 0.15 + 0.6 * morning + 0.7 * evening
    return np.clip(base, 0, 1.2)


def generate_dataset(n_segments=112, n_days=60, seed=42):
    """
    Simulate `n_days` of hourly congestion for `n_segments` road segments.
    Returns a tidy DataFrame ready for feature engineering.
    """
    rng = np.random.default_rng(seed)

    seg_popularity = rng.uniform(0.5, 1.5, size=n_segments)

    rows = []
    prev_congestion = {s: 0.2 for s in range(n_segments)}

    for day in range(n_days):
        dow = day % 7
        weekend_factor = 0.6 if dow in (5, 6) else 1.0
        for hour in range(24):
            tod = _time_of_day_profile(hour)
            for s in range(n_segments):
                base = tod * seg_popularity[s] * weekend_factor
                persisted = 0.7 * base + 0.3 * prev_congestion[s]
                noise = rng.normal(0, 0.08)
                congestion = float(np.clip(persisted + noise, 0, 1))
                rows.append(
                    {
                        "segment_id": s,
                        "day_of_week": dow,
                        "hour": hour,
                        "seg_popularity": float(seg_popularity[s]),
                        "lag_1": float(prev_congestion[s]),
                        "congestion": congestion,
                    }
                )
                prev_congestion[s] = congestion

    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = generate_dataset()
    print(df.head())
    print(f"\nRows: {len(df):,}  Segments: {df.segment_id.nunique()}  "
          f"Congestion mean: {df.congestion.mean():.3f}")
