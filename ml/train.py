"""
QuantumRoute — short-term congestion prediction model (XGBoost).

RUN:  python train.py

This single command:
  1. Generates the synthetic dataset (see generate_data.py for assumptions).
  2. Builds features and target.
  3. Trains an XGBoost regressor to predict next-step congestion.
  4. Evaluates on a held-out test set (MAE, RMSE, R2).
  5. Saves the trained model to  model/congestion_model.joblib
  6. Saves a metrics summary to  model/metrics.json

No manual steps, no notebooks. Reviewers can edit generate_data.py to plug in
real data and re-run this unchanged.
"""

import json
import os
import time

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib

from generate_data import generate_dataset

MODEL_DIR = "model"
TARGET = "congestion"


def add_cyclical_features(df):
    """
    Hour and day-of-week are cyclical (hour 23 is next to hour 0). Encode them as
    sin/cos so the model sees that wrap-around instead of a hard 23->0 jump.
    """
    df = df.copy()
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    return df


def main():
    t0 = time.time()
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("[1/5] Generating synthetic dataset...")
    df = generate_dataset()
    df = add_cyclical_features(df)

    feature_cols = [
        "segment_id", "seg_popularity", "lag_1",
        "hour_sin", "hour_cos", "dow_sin", "dow_cos",
    ]
    X = df[feature_cols]
    y = df[TARGET]

    print(f"      dataset: {len(df):,} rows, {len(feature_cols)} features")

    print("[2/5] Splitting train/test...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("[3/5] Training XGBoost regressor...")
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    print("[4/5] Evaluating...")
    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = float(r2_score(y_test, preds))

    importances = dict(
        sorted(
            zip(feature_cols, (float(v) for v in model.feature_importances_)),
            key=lambda kv: kv[1],
            reverse=True,
        )
    )

    print(f"      MAE={mae:.4f}  RMSE={rmse:.4f}  R2={r2:.4f}")
    print("      top features:", ", ".join(list(importances)[:3]))

    print("[5/5] Saving model + metrics...")
    model_path = os.path.join(MODEL_DIR, "congestion_model.joblib")
    joblib.dump({"model": model, "features": feature_cols}, model_path)

    metrics = {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "n_rows": int(len(df)),
        "features": feature_cols,
        "feature_importances": importances,
        "train_seconds": round(time.time() - t0, 2),
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nDone in {metrics['train_seconds']}s.")
    print(f"Model saved to: {model_path}")
    print(f"Metrics saved to: {os.path.join(MODEL_DIR, 'metrics.json')}")


if __name__ == "__main__":
    main()
