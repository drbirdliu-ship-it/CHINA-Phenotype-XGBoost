"""Compare packaged browser inference with native XGBoost.

Without --data, validate illustrative examples. With --data, validate every source
record, numerical split boundaries and 1,000 synthetic cases for each model.
Only aggregate results are written; inputs are passed to Node through stdin.
"""
import argparse
import json
from pathlib import Path
import subprocess
import numpy as np
import pandas as pd
import xgboost as xgb

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--data", type=Path)
parser.add_argument("--output", type=Path)
args = parser.parse_args()
examples = json.loads((ROOT / "examples/predictors.json").read_text())
frame = pd.read_csv(args.data, sep="\t") if args.data else None
results = {}
for variant in ("model11", "model9"):
    model_path = ROOT / "models" / variant / "xgboost_model.json"
    raw = json.loads(model_path.read_text())
    booster = xgb.Booster(params={"nthread": 2}); booster.load_model(model_path)
    features = booster.feature_names
    if frame is None:
        inputs = np.asarray([[float({**examples[variant], "SEX": sex}[key]) for key in features] for sex in (0, 1)])
        counts = {"illustrative_cases": 2}
    else:
        original = frame[features].to_numpy(dtype=float)
        if not np.isfinite(original).all():
            raise ValueError("Validation data must contain finite values for every predictor.")
        boundaries = set()
        for tree in raw["learner"]["gradient_booster"]["model"]["trees"]:
            for node, left in enumerate(tree["left_children"]):
                if left != -1:
                    boundaries.add((tree["split_indices"][node], float(np.float32(tree["split_conditions"][node]))))
        baseline = np.median(original, axis=0)
        boundary_rows = []
        for feature, threshold in sorted(boundaries):
            t = np.float32(threshold)
            for value in (np.nextafter(t, np.float32(-np.inf)), t, np.nextafter(t, np.float32(np.inf))):
                if features[feature] == "SEX" and value not in (0, 1):
                    continue
                row = baseline.copy(); row[feature] = float(value); boundary_rows.append(row)
        rng = np.random.default_rng(20260925)
        synthetic = rng.uniform(original.min(axis=0), original.max(axis=0), size=(1000, len(features)))
        synthetic[:, features.index("SEX")] = rng.integers(0, 2, size=1000)
        inputs = np.concatenate([original, np.asarray(boundary_rows), synthetic])
        counts = {"original_records": len(original), "boundary_records": len(boundary_rows), "synthetic_records": 1000}
    matrix = xgb.DMatrix(inputs, feature_names=features, nthread=2)
    reference = {
        "engine": str(ROOT / "docs" / variant / "engine.mjs"), "features": features,
        "inputs": inputs.tolist(), "probabilities": booster.predict(matrix).tolist(),
        "margins": booster.predict(matrix, output_margin=True).tolist(),
    }
    result = subprocess.run(["node", str(ROOT / "scripts/check_parity.mjs")], input=json.dumps(reference), text=True, capture_output=True, check=True)
    results[variant] = {**counts, **json.loads(result.stdout)}
print(json.dumps(results, indent=2))
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(results, indent=2) + "\n")
