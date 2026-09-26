"""Export the bundled native models into the browser's numerical-tree format."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for variant in ("model11", "model9"):
    source = ROOT / "models" / variant
    path = source / "xgboost_model.json"
    raw = json.loads(path.read_text())
    metrics = json.loads((source / "model_metrics.json").read_text())
    learner = raw["learner"]
    assert learner["objective"]["name"] == "multi:softprob"
    assert learner["gradient_booster"]["name"] == "gbtree"
    assert learner["feature_names"] == metrics["features"]
    assert int(learner["learner_model_param"]["num_class"]) == 4
    forest = learner["gradient_booster"]["model"]
    model = {
        "features": learner["feature_names"],
        "base": json.loads(learner["learner_model_param"]["base_score"]),
        "classes": ["α", "β", "γ", "δ"],
        "version": metrics["model_version"],
        "sourceSHA256": hashlib.sha256(path.read_bytes()).hexdigest(), "trees": [],
    }
    for tree, group in zip(forest["trees"], forest["tree_info"]):
        assert not any(tree["split_type"]), "Categorical trees require a different evaluator."
        model["trees"].append({"c": group, "f": tree["split_indices"], "v": tree["split_conditions"], "l": tree["left_children"], "r": tree["right_children"]})
    public = {key: metrics[key] for key in ("train_size", "test_size", "test_accuracy")}
    public["version"] = metrics["model_version"]
    public["ranges"] = {key: {"min": value["min"], "max": value["max"]} for key, value in metrics["feature_ranges"].items()}
    destination = ROOT / "docs" / variant / "model.mjs"
    destination.write_text("export const MODEL = " + json.dumps(model, ensure_ascii=False, separators=(",", ":")) + ";\nexport const METRICS = " + json.dumps(public, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"model": variant, "features": len(model["features"]), "trees": len(model["trees"]), "source_sha256": model["sourceSHA256"]}))
