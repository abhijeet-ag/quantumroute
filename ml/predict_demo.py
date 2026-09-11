"""
Load the trained model and make a few sample predictions.
RUN (after train.py):  python predict_demo.py
Proves the saved model artifact is usable, and shows sensible behavior.
"""
import numpy as np
import joblib

bundle = joblib.load("model/congestion_model.joblib")
model = bundle["model"]


def row(hour, dow, seg=5, pop=1.2, lag=0.5):
    return [seg, pop, lag,
            np.sin(2 * np.pi * hour / 24), np.cos(2 * np.pi * hour / 24),
            np.sin(2 * np.pi * dow / 7), np.cos(2 * np.pi * dow / 7)]


X = np.array([row(9, 0), row(3, 0), row(18, 0), row(9, 6)])
preds = model.predict(X)
labels = ["Mon 9am (rush)", "Mon 3am (night)", "Mon 6pm (rush)", "Sun 9am (weekend)"]
for l, p in zip(labels, preds):
    print(f"  {l:20s} -> predicted congestion {p:.3f}")
print("\nSanity: rush hours should predict higher than 3am / weekend.")
