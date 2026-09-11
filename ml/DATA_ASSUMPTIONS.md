# ML Pipeline — Data Assumptions & How to Use Real Data

This document is for the ML reviewers on the team. It explains exactly what the
synthetic congestion dataset assumes, how the model is trained and evaluated, and
how to swap in a real dataset without touching the rest of the pipeline.

The pipeline is standalone (not wired into the web app in this pass). It exists so
you can review the modeling choices, judge whether the synthetic results are
believable, and retrain on real data if you have it.

---

## What the pipeline does

`python train.py` runs six steps end to end, no manual data wrangling:
1. Generate a synthetic dataset (`generate_data.py`).
2. Add cyclical time features (hour and day-of-week as sin/cos).
3. Train/test split (80/20).
4. Train an XGBoost regressor.
5. Evaluate: MAE, RMSE, R2 on the held-out test set.
6. Save `model/congestion_model.joblib` and `model/metrics.json`.

Target variable: **congestion**, a value in [0, 1] per (road segment, hour, day).
The model predicts near-term congestion from segment identity, recent congestion,
and time-of-day / day-of-week.

---

## What the synthetic data assumes

Each row = congestion for one road segment in one hourly time step. The generator
(`generate_data.py`) builds it from these assumptions, all explicitly documented in
that file's docstring:

1. **Daily rhythm.** Two rush-hour peaks - morning (~9:00) and evening (~18:00) -
   modeled as Gaussian bumps over the 24-hour clock, low overnight.
2. **Weekend effect.** Saturday/Sunday have lower, flatter congestion than weekdays
   (a 0.6 multiplier).
3. **Per-segment popularity.** Each segment has an intrinsic busyness multiplier
   (uniform 0.5-1.5), so some roads are consistently busier - like real arterials
   vs side streets.
4. **Short-term persistence.** Congestion now correlates with congestion one step
   ago (traffic doesn't teleport). Captured by a `lag_1` feature.
5. **Noise.** Gaussian noise is added so the signal isn't perfectly learnable. This
   deliberately caps achievable accuracy - a realistic ceiling, not a bug. It's why
   R2 lands around 0.90 rather than a suspicious 0.99+.

Default size: 112 segments x 60 days x 24 hours = ~161k rows. The 112 segments
mirror the web app's Medium (8x8) network edge count, so the two line up
conceptually even though they aren't wired together in this pass.

---

## Why these features / this model

- **XGBoost** was chosen over an LSTM for speed, simplicity, and easy review:
  trains in a few seconds, standard for tabular prediction, no GPU, easy to explain.
  An LSTM is a reasonable Phase 2 alternative if you want a sequence model.
- **Cyclical encoding** (sin/cos of hour and day-of-week) tells the model that hour
  23 is adjacent to hour 0, which a raw integer wouldn't convey.
- Expected result: top features are `lag_1` and the hour terms - i.e. recent
  congestion and time of day drive near-term congestion. If your run shows that,
  the model learned the sensible thing.

---

## How to substitute a real dataset

Replace `generate_dataset()` in `generate_data.py` with a loader returning a pandas
DataFrame with these columns:

```
segment_id       int    - which road segment
day_of_week      int    - 0=Mon ... 6=Sun
hour             int    - 0..23
seg_popularity   float  - intrinsic busyness (or a constant if unknown)
lag_1            float  - congestion in the previous time step, in [0,1]
congestion       float  - the target, in [0,1]
```

Everything downstream (feature engineering, training, evaluation, saving) stays
identical - `train.py` needs no changes.

**Real data sources to consider:**
- Loop-detector or inductive-loop vehicle counts, normalized to a congestion index.
- GPS floating-car / probe data aggregated to (segment, time-bucket).
- City open-data traffic APIs.
- Map-provider speed data (observed speed / free-flow speed gives a congestion
  ratio directly).

Aggregate whatever source you use to one row per (segment, time-bucket), compute a
congestion index in [0,1], and derive `lag_1` by shifting within each segment's
time series. Then `python train.py` retrains unchanged.

---

## Files

- `generate_data.py` - synthetic dataset generator (replace for real data).
- `train.py` - the whole pipeline; run with `python train.py`.
- `predict_demo.py` - loads the saved model and prints sample predictions.
- `requirements.txt` - Python dependencies.
- `model/` - created on first run; holds the saved model and metrics.

## Mac setup note

If `python3 train.py` fails with `libxgboost.dylib could not be loaded ...
libomp.dylib`, install Apple's OpenMP runtime once: `brew install libomp`, then
re-run. This is a known XGBoost-on-Mac requirement and doesn't affect anything else.
