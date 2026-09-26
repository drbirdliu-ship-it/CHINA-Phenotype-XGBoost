"""Run native XGBoost inference using supplied or illustrative predictors."""
import argparse
import json
import math
from pathlib import Path
import pandas as pd
import xgboost as xgb

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--model", choices=["model11", "model9"], required=True)
parser.add_argument("--input", type=Path, default=ROOT / "examples/predictors.json")
args = parser.parse_args()
booster = xgb.Booster(params={"nthread": 2})
booster.load_model(ROOT / "models" / args.model / "xgboost_model.json")
payload = json.loads(args.input.read_text())
payload = payload.get(args.model, payload)
row = {}
for name in booster.feature_names:
    value = payload.get(name)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError(f"Missing or invalid predictor: {name}")
    row[name] = float(value)
if row["SEX"] not in (0, 1):
    raise ValueError("SEX must use 0=male and 1=female.")
if "LVEF" in row and row["LVEF"] > 100:
    raise ValueError("LVEF must not exceed 100%.")
matrix = xgb.DMatrix(pd.DataFrame([row], columns=booster.feature_names), nthread=2)
probabilities = booster.predict(matrix)[0]
winner = int(probabilities.argmax())
print(json.dumps({"model": args.model, "predicted_code": winner + 1, "predicted_symbol": ["α", "β", "γ", "δ"][winner], "probabilities": probabilities.tolist()}, ensure_ascii=False, indent=2))
