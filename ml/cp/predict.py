"""Emit per-CP-segment congestion predictions for demo time slots.
RUN (after train.py, from ml/cp/): python predict.py -> predictions.json
Keyed by segment key "min-max" (matches app's ek()), values in [0,1]."""
import json
import numpy as np
import joblib

SLOTS = [
    {"id":"mon_9am","label":"Monday 9:00 (AM peak)","hour":9,"dow":0},
    {"id":"wed_2pm","label":"Wednesday 14:00 (midday)","hour":14,"dow":2},
    {"id":"fri_6pm","label":"Friday 18:00 (PM peak)","hour":18,"dow":4},
    {"id":"sun_11am","label":"Sunday 11:00 (weekend)","hour":11,"dow":6},
]

def main():
    b = joblib.load("model/cp_congestion_model.joblib")
    model, seg_map = b["model"], b["seg_map"]
    seg_keys = list(seg_map.keys())
    pop = {s: 0.5 + (int(__import__("hashlib").md5(s.encode()).hexdigest(),16) % 1000)/1000.0 for s in seg_keys}

    out = {"slots": SLOTS, "predictions": {}}
    for slot in SLOTS:
        h, d = slot["hour"], slot["dow"]
        rows = [[seg_map[s], pop[s], 0.4,
                 np.sin(2*np.pi*h/24), np.cos(2*np.pi*h/24),
                 np.sin(2*np.pi*d/7), np.cos(2*np.pi*d/7)] for s in seg_keys]
        preds = model.predict(np.array(rows))
        out["predictions"][slot["id"]] = {s: round(float(p),4) for s,p in zip(seg_keys, preds)}

    json.dump(out, open("predictions.json","w"))
    for slot in SLOTS:
        vals = list(out["predictions"][slot["id"]].values())
        print(f"{slot['label']}: mean {np.mean(vals):.3f}, max {np.max(vals):.3f}")
    print(f"\nwrote predictions.json ({len(seg_keys)} segments x {len(SLOTS)} slots)")

if __name__=="__main__": main()
