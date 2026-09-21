"""CP congestion model. RUN (from ml/cp/): python train.py
-> model/cp_congestion_model.joblib + model/metrics.json"""
import json, os, time
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
from generate_data import generate_dataset

MODEL_DIR = "model"

def cyc(df):
    df = df.copy()
    df["hour_sin"]=np.sin(2*np.pi*df.hour/24); df["hour_cos"]=np.cos(2*np.pi*df.hour/24)
    df["dow_sin"]=np.sin(2*np.pi*df.day_of_week/7); df["dow_cos"]=np.cos(2*np.pi*df.day_of_week/7)
    df["seg_code"]=df.seg_key.astype("category").cat.codes
    return df

def main():
    t0=time.time(); os.makedirs(MODEL_DIR,exist_ok=True)
    print("[1/5] generating CP dataset..."); df=cyc(generate_dataset())
    seg_map = dict(zip(df.seg_key, df.seg_code))
    feats=["seg_code","seg_popularity","lag_1","hour_sin","hour_cos","dow_sin","dow_cos"]
    X=df[feats]; y=df.congestion
    print(f"      {len(df):,} rows, {len(feats)} features")
    print("[2/5] split..."); Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.2,random_state=42)
    print("[3/5] train XGBoost...")
    m=XGBRegressor(n_estimators=300,max_depth=6,learning_rate=0.08,subsample=0.9,colsample_bytree=0.9,random_state=42,n_jobs=-1)
    m.fit(Xtr,ytr)
    print("[4/5] eval...")
    p=m.predict(Xte); mae=float(mean_absolute_error(yte,p)); rmse=float(np.sqrt(mean_squared_error(yte,p))); r2=float(r2_score(yte,p))
    print(f"      MAE={mae:.4f} RMSE={rmse:.4f} R2={r2:.4f}")
    print("[5/5] save...")
    joblib.dump({"model":m,"features":feats,"seg_map":seg_map}, f"{MODEL_DIR}/cp_congestion_model.joblib")
    json.dump({"mae":mae,"rmse":rmse,"r2":r2,"n_rows":int(len(df)),"segments":int(df.seg_key.nunique()),"train_seconds":round(time.time()-t0,2)}, open(f"{MODEL_DIR}/metrics.json","w"), indent=2)
    print(f"done {round(time.time()-t0,2)}s -> {MODEL_DIR}/cp_congestion_model.joblib")

if __name__=="__main__": main()
