# Reproducibility and scope

There are three distinct checks:

1. Run the released classifiers on a predictor set using native Python or the browser.
   This needs the released weights, but does not need the original cohort.
2. Verify browser/native numerical parity. The supplied examples work without the
   cohort. Full-cohort and threshold-neighbor checks require access to the data.
3. Reproduce training and hold-out metrics. This requires the original, correctly
   ordered 3,083-row dataset and the recorded package versions.

The source data are not included. No arbitrary synthetic cohort is supplied as
if it were the original dataset. The example input is illustrative only.

Both models use `multi:softprob`, four outcome classes, 180 boosting rounds,
depth 3, learning rate 0.045, row and feature subsampling 0.9, minimum child
weight 2, L2 regularization 1.5, L1 regularization 0.05, base score 0, random
seed 20260925 and two training threads. The full machine-readable settings are
in `model_config.json`. No early stopping or test-set hyperparameter tuning was used.

The 80/20 split is stratified by phenotype and preserves the same test subjects
for both models. The 11-predictor test accuracy is 0.7747163695299838 and the
9-predictor test accuracy is 0.6693679092382496. Report these as internal hold-out
estimates. A source-code release is not external clinical validation.

The browser engine uses float32 inputs, thresholds and leaves, float32 margin
accumulation and four-class softmax. Naive JavaScript double-precision comparisons
against JSON thresholds can disagree at branch boundaries; the parity check
therefore includes neighboring float32 values at all unique numerical splits.

Native/browser parity results are in `validation/release_parity.json`.
Training reproduction is reported in `validation/training_reproduction.json`.
Exact model serialization is recorded as an environment-specific check;
other library versions, hardware or serialization changes may differ bytewise.

Original public-app behavior is preserved. The release changes PWA manifest IDs
and cache namespaces so both apps can coexist under a single GitHub Pages origin.
The original live deployments are untouched. Numerical validation runs in Python
and Node.js. Release preparation also checks JavaScript syntax and local asset
paths; it does not constitute a live-browser usability test.

Reference for numerical precision:
https://xgboost.readthedocs.io/en/latest/R-package/xgboostfromJSON.html
