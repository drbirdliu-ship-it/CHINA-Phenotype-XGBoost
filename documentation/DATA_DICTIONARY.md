# Data dictionary

Training data use a tab-separated file with the following column names. The
original target spelling `phenotyoe` is intentionally retained. Units follow the
supplied calculator specification. The original study data dictionary remains
authoritative when preparing new data.

| Column | Description | Unit or coding | Model 11 | Model 9 |
| --- | --- | --- | --- | --- |
| Glucose | Glucose | mmol/L | Yes | Yes |
| PaCO2 | Arterial partial pressure of carbon dioxide | mmHg | Yes | Yes |
| Albumin | Albumin | g/L | Yes | Yes |
| Platelet | Platelet count | 10^9/L | Yes | Yes |
| Leukocyte | Leukocyte count | 10^9/L | Yes | Yes |
| Age | Age | years | Yes | Yes |
| BMI | Body mass index | kg/m² | Yes | Yes |
| MAP | Mean arterial pressure | mmHg | Yes | Yes |
| LVEDD | Left ventricular end-diastolic diameter | mm | Yes | No |
| LVEF | Left ventricular ejection fraction | % | Yes | No |
| SEX | Sex | 0=male; 1=female | Yes | Yes |
| phenotyoe | Outcome class | 1=α; 2=β; 3=γ; 4=δ | Target | Target |
| ID | Original record identifier | Not a predictor; not needed for prediction | No | No |

The released models were trained on complete predictor data. The supplied
training script fails on missing/nonfinite values rather than introducing an
unreported imputation procedure. Input ordering is defined in `model_config.json`.
Do not add an index column to the predictor matrix. The browser requires every
predictor in the selected model and flags values outside the original observed range.
