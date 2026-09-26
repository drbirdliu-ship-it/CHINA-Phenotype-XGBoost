"""Read an authorized cohort without reordering or publishing patient records."""
from pathlib import Path
import numpy as np
import pandas as pd


def read_data(path):
    path = Path(path)
    if path.suffix.lower() == ".xlsx":
        frame = pd.read_excel(path, sheet_name=0, engine="openpyxl")
    elif path.suffix.lower() == ".csv":
        frame = pd.read_csv(path)
    else:
        frame = pd.read_csv(path, sep="\t")
    if frame.empty:
        raise ValueError("The source cohort is empty.")
    if "ID" in frame and (frame.ID.isna().any() or frame.ID.duplicated().any()):
        raise ValueError("Record IDs must be present and unique when an ID column is supplied.")
    if "Age" not in frame or not np.isfinite(frame.Age.to_numpy(dtype=float)).all():
        raise ValueError("Age must contain complete finite numeric values.")
    if (frame.Age < 18).any():
        raise ValueError("This adult cohort must not contain ages below 18 years. Verify the source data.")
    return frame
