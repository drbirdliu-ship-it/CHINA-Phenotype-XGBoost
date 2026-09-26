# Model revision history

## 2026-09-26-age-corrected (current)

- Retrained both XGBoost models on the corrected 3,083-record cohort.
- Verified six corrected ages by private ID alignment; no other predictors or phenotype labels changed. Ages now range from 18 to 84 years.
- Preserved predictor sets, class coding (1=α, 2=β, 3=γ, 4=δ), sex coding (0=male, 1=female), hyperparameters and purple/sky-blue interfaces.
- Applied the same stratified 80/20 protocol and seed to the corrected worksheet order. Test membership differs from the previous release because rows were reordered. Both new models share the new 617-record test set.
- Replaced both live calculators at their existing public URLs. New module versions and cache migration remove superseded cached models after a connected update.
- Added XLSX input support, adult-age validation and aggregate data-revision auditing. No patient records or identifiers are distributed.

## Superseded weights from commit d19f2a62d114c9d58d0dac2996e0075f6f70fe0f

The original 11- and 9-predictor models were fitted before the age correction.
They are withdrawn from current use and retained only in Git history for auditability.
Their reported internal accuracies (77.5% and 66.9%) do not describe the corrected models.
Downloaded files and disconnected installed apps cannot be revoked remotely.
Reopen the calculators online and verify the current revision before calculation.
This revision label is a model identifier, not a GitHub Release tag or a Zenodo DOI.
