# CHINA Phenotype: XGBoost models and web calculators

Source code and trained models for the 11-predictor and 9-predictor research models.
GitHub repository: https://github.com/drbirdliu-ship-it/CHINA-Phenotype-XGBoost
Author attribution, copyright-holder information, and license selection remain pending.
The files in `publication/` are inactive templates, not finalized publication metadata.
No Zenodo archive or DOI has been created. The proposed first formal release is `v1.0.0`.

## Included models

| Model | Predictors | Training records | Test records | Internal test accuracy |
| --- | --- | ---: | ---: | ---: |
| `model11` | Glucose, PaCO2, Albumin, Platelet, Leukocyte, Age, BMI, MAP, LVEDD, LVEF, SEX | 2,466 | 617 | 0.7747163695 |
| `model9` | Glucose, PaCO2, Albumin, Platelet, Leukocyte, Age, BMI, MAP, SEX | 2,466 | 617 | 0.6693679092 |

The outcome column is named `phenotyoe` in the source data and uses 1=α, 2=β,
3=γ, 4=δ. SEX uses 0=male and 1=female. Both models used the same stratified
80/20 split of 3,083 records, seed 20260925, and the same fixed hyperparameters.
The nine-predictor model was fitted separately. It is not an eleven-predictor
model with two fields hidden or imputed.

All reported performance is internal hold-out performance. External validation
has not been supplied. This software is intended for research evaluation.

## Run the calculators

The models run in the browser. No Python packages, API key, or prediction server
are needed for inference. To serve the files locally, install Python 3 and run
this command from the repository directory:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Open `http://127.0.0.1:8000/` on that same computer and keep the terminal running.
The page links to both calculators. Use **Load example** followed by
**Calculate phenotype** for an illustrative calculation. The bundled examples
are not individual patient records. Directly opening HTML files from disk is
not supported because the calculators import JavaScript modules.

For GitHub Pages, set the publishing source to your default branch and `/docs`.
The `/docs` directory contains a landing page and both calculators. See
`documentation/PUBLISHING.md`. A code DOI identifies an archive; Zenodo does not
replace the live web-calculator host.

## Native prediction and reproduction

The recorded environment uses Python 3.12. Install the pinned packages in a
virtual environment:

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/predict.py --model model11
python scripts/predict.py --model model9
```

Use `--input path/to/predictors.json` for another numerical predictor object.

Training needs the original study data, which are **not distributed** in this
code release. No data-access approval or data-sharing license is implied by
the code release. With authorized access, retain the original row order:

```sh
python scripts/train_models.py --data /path/to/study-data.txt --model both
```

This writes new models and aggregate metrics under `retrained_models/` while
preserving the bundled reference models. The script records hashes of the
source file and test-row positions without publishing patient-level records.
See `model_config.json` for the complete parameters and feature order.

## Verify browser/native agreement

Node.js is needed only for the independent parity check. The checked runtime is
recorded in `validation/release_environment.json`.

```sh
python scripts/validate_models.py
python scripts/validate_models.py --data /path/to/study-data.txt --output validation/local_parity.json
```

The second command checks every source record, numerical split boundaries and
1,000 synthetic inputs per model. It passes inputs to the local Node process
through stdin and writes only aggregate results. The original and release
validation reports are in `validation/`.

`scripts/export_models.py` recreates `docs/model11/model.mjs` and
`docs/model9/model.mjs` from the bundled native model files. The inference engine
converts inputs, thresholds and leaf values to float32 and rounds margin
accumulation before softmax. It does not call an LLM or external prediction API.

## Files

| Location | Contents |
| --- | --- |
| `docs/` | Complete calculators and entry page; suitable for GitHub Pages |
| `models/` | Both native model files and original aggregate evaluation reports |
| `scripts/` | Training, native prediction, model export and parity validation |
| `examples/` | Clearly labeled illustrative inputs |
| `documentation/` | Data dictionary, reproducibility notes and publication steps |
| `publication/` | Citation, Zenodo metadata and proposed-license templates |
| `validation/` | Aggregate numerical validation and release checks |
| `SHA256SUMS.txt` | Checksums for the prepared release files |

The public package excludes patient records, deployment credentials, host-specific
project configuration, and the original private Git history. The two existing
hosted calculators are not changed by preparing this package.

## License and citation

License selection and author attribution remain pending. A proposed MIT license
template is supplied for the authors to consider; it has **not** been applied.
Confirm the appropriate copyright holder and code/model redistribution rights
with your study team or institution before publishing. Dependencies are installed
separately and retain their upstream licenses.

Complete `publication/CITATION.cff.example` and move it to the repository root as
`CITATION.cff`. The optional `.zenodo.json.example` supports Zenodo-specific
metadata; when both active files are present, keep their creator and license
information synchronized because Zenodo prioritizes `.zenodo.json`.

Record the real GitHub URL, release tag, commit and Zenodo DOI only after they
exist. The manuscript wording template is in `documentation/CODE_AVAILABILITY.md`.
