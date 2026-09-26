"""Reproduce either or both models from the study's tab-separated data."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "model_config.json").read_text())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", required=True, type=Path)
    parser.add_argument("--model", choices=["model11", "model9", "both"], default="both")
    parser.add_argument("--output", type=Path, default=ROOT / "retrained_models")
    args = parser.parse_args()
    frame = pd.read_csv(args.data, sep="\t")
    target = frame[CONFIG["target_column"]].to_numpy(dtype=float)
    if not np.isfinite(target).all() or not set(target).issubset({1, 2, 3, 4}) or len(set(target)) != 4:
        raise ValueError("Expected the four outcome codes 1, 2, 3, 4.")
    y = pd.Series(target.astype(int) - 1, index=frame.index)
    if not set(frame.SEX.unique()).issubset({0, 1}):
        raise ValueError("SEX must use 0=male and 1=female.")
    variants = list(CONFIG["features"]) if args.model == "both" else [args.model]
    summary = {}
    for variant in variants:
        features = CONFIG["features"][variant]
        x = frame[features].astype(float)
        if not np.isfinite(x.to_numpy()).all():
            raise ValueError("This fixed protocol expects complete, finite predictor data.")
        x_train, x_test, y_train, y_test = train_test_split(
            x, y, test_size=CONFIG["split"]["test_fraction"],
            random_state=CONFIG["split"]["random_state"], stratify=y,
        )
        model = XGBClassifier(**CONFIG["parameters"])
        # Evaluation logging does not change the fixed 180-round training.
        # There is no early stopping or hyperparameter selection on this test set.
        model.fit(x_train, y_train, eval_set=[(x_test, y_test)], verbose=False)
        pred = model.predict(x_test)
        destination = args.output / variant
        destination.mkdir(parents=True, exist_ok=True)
        model_path = destination / "xgboost_model.json"
        model.get_booster().save_model(model_path)
        report = {
            "features": features, "target_column": CONFIG["target_column"],
            "class_mapping": CONFIG["class_mapping"], "sex_mapping": CONFIG["sex_mapping"],
            "sample_size": len(frame), "train_size": len(x_train), "test_size": len(x_test),
            "test_accuracy": float(accuracy_score(y_test, pred)),
            "classification_report": classification_report(y_test, pred, target_names=["α", "β", "γ", "δ"], output_dict=True, zero_division=0),
            "confusion_matrix": confusion_matrix(y_test, pred, labels=[0, 1, 2, 3]).tolist(),
            "feature_ranges": {name: {"min": float(x[name].min()), "max": float(x[name].max())} for name in features},
            "parameters": CONFIG["parameters"], "split": CONFIG["split"],
            "source_data_sha256": hashlib.sha256(args.data.read_bytes()).hexdigest(),
            "test_row_positions_sha256": hashlib.sha256(np.asarray(x_test.index, dtype="<i8").tobytes()).hexdigest(),
            "model_sha256": hashlib.sha256(model_path.read_bytes()).hexdigest(),
        }
        (destination / "model_metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        summary[variant] = {key: report[key] for key in ("train_size", "test_size", "test_accuracy", "model_sha256")}
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
