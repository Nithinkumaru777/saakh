"""Saakh Credit Risk Model: Training, Calibration, and Inference.

SPEC cards: F07, F08, F09.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    brier_score_loss,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from ml.features import FEATURE_NAMES, MONOTONE_CONSTRAINTS, engineer_features

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
MODEL_CARD_PATH = ARTIFACTS_DIR / "model_card.md"

_LOADED_MODEL_BUNDLE: dict[str, Any] | None = None


def pd_to_grade(pd_val: float) -> tuple[str, str]:
    """Map calibrated probability of default to risk grade and label.
    
    SPEC §F09:
    - A: < 0.03 "Low risk"
    - B: < 0.07 "Low risk"
    - C: < 0.15 "Moderate"
    - D: < 0.30 "Elevated"
    - E: >= 0.30 "High"
    - Boundary values map to the upper band (e.g. 0.03 -> B, 0.07 -> C, etc.)
    """
    p = round(float(pd_val), 4)
    if p < 0.03:
        return "A", "Low risk"
    elif p < 0.07:
        return "B", "Low risk"
    elif p < 0.15:
        return "C", "Moderate"
    elif p < 0.30:
        return "D", "Elevated"
    else:
        return "E", "High"


class PlattCalibrator:
    """Platt scaling: Sigmoid calibration fitted on the validation set log-odds / margins."""

    def __init__(self):
        self.lr = LogisticRegression(C=1e5, solver="lbfgs")

    def fit(self, margins: np.ndarray, y: np.ndarray) -> PlattCalibrator:
        self.lr.fit(margins.reshape(-1, 1), y)
        return self

    def predict_proba(self, margins: np.ndarray) -> np.ndarray:
        return self.lr.predict_proba(margins.reshape(-1, 1))

    def prob_of_margin(self, margin: float | np.ndarray) -> float | np.ndarray:
        m = np.asarray(margin, dtype=np.float32).reshape(-1, 1)
        probs = self.lr.predict_proba(m)[:, 1]
        if np.ndim(margin) == 0:
            return float(probs[0])
        return probs


def build_feature_matrix(df: pd.DataFrame) -> np.ndarray:
    """Transform raw dataframe rows into model feature matrix."""
    rows = []
    for _, row in df.iterrows():
        feat = engineer_features(row.to_dict())
        rows.append(feat["vector"])
    return np.array(rows, dtype=np.float32)


def get_monotone_tuple() -> tuple[int, ...]:
    """Return tuple of monotone constraints ordered by FEATURE_NAMES."""
    return tuple(MONOTONE_CONSTRAINTS.get(name, 0) for name in FEATURE_NAMES)


def train_model(df: pd.DataFrame) -> tuple[Any, dict[str, Any]]:
    """Train monotonically constrained XGBoost classifier with Platt scaling.
    
    SPEC §F07:
    - 70/15/15 stratified split
    - XGBClassifier with monotone constraints
    - Calibrated with sigmoid Platt scaling on validation set
    - AUC >= 0.80, Brier <= 0.11
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    X = build_feature_matrix(df)
    y = df["default_12m"].to_numpy(dtype=int)

    # 70% train, 30% temp (seed 42)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    # Split temp into 15% val and 15% test
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    monotone_constraints = get_monotone_tuple()

    # Monotonically constrained XGBoost
    xgb = XGBClassifier(
        n_estimators=600,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="auc",
        early_stopping_rounds=100,
        monotone_constraints=monotone_constraints,
        random_state=42,
    )
    xgb.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    # Platt scaling on validation set
    val_margins = xgb.predict(X_val, output_margin=True)
    calibrated_model = PlattCalibrator().fit(val_margins, y_val)

    # Baseline: Traditional Scorecard Logistic Regression on standardized core credit features
    scaler = StandardScaler()
    X_train_core = X_train[:, :7]
    X_test_core = X_test[:, :7]
    X_train_scaled = scaler.fit_transform(X_train_core)
    X_test_scaled = scaler.transform(X_test_core)
    baseline_lr = LogisticRegression(random_state=42, max_iter=1000)
    baseline_lr.fit(X_train_scaled, y_train)
    baseline_probs = baseline_lr.predict_proba(X_test_scaled)[:, 1]
    baseline_auc = float(roc_auc_score(y_test, baseline_probs))

    # Evaluate Calibrated Model on Test split
    test_margins = xgb.predict(X_test, output_margin=True)
    test_probs = calibrated_model.prob_of_margin(test_margins)
    test_auc = float(roc_auc_score(y_test, test_probs))
    test_brier = float(brier_score_loss(y_test, test_probs))

    # KS Statistic
    def calc_ks(y_true, y_prob):
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        return float(np.max(tpr - fpr))

    test_ks = calc_ks(y_test, test_probs)

    # Evaluation at Grade D/E boundary (PD = 0.30)
    y_pred_at_30 = (test_probs >= 0.30).astype(int)
    cm = confusion_matrix(y_test, y_pred_at_30).tolist()
    tp = cm[1][1]
    fp = cm[0][1]
    fn = cm[1][0]
    precision_30 = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall_30 = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    acc_30 = float(np.mean(y_test == y_pred_at_30))

    # ROC Points (<= 100 points)
    fpr, tpr, thresholds = roc_curve(y_test, test_probs)
    step = max(1, len(fpr) // 80)
    roc_points = [
        {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
        for f, t in zip(fpr[::step], tpr[::step])
    ]

    # Calibration Curve (10 bins)
    prob_true, prob_pred = calibration_curve(y_test, test_probs, n_bins=10)
    calib_points = [
        {"prob_pred": round(float(pp), 4), "prob_true": round(float(pt), 4)}
        for pp, pt in zip(prob_pred, prob_true)
    ]

    # Feature Importance (Gain & Weight from XGBoost)
    importance_scores = xgb.feature_importances_
    global_importance = [
        {"feature": name, "importance": round(float(score), 4)}
        for name, score in zip(FEATURE_NAMES, importance_scores)
    ]
    global_importance.sort(key=lambda x: x["importance"], reverse=True)

    metrics = {
        "model_version": "xgb-2026.11-v1",
        "auc": round(test_auc, 4),
        "brier": round(test_brier, 4),
        "ks": round(test_ks, 4),
        "baseline_auc": round(baseline_auc, 4),
        "accuracy_de_boundary": round(acc_30, 4),
        "precision_de_boundary": round(precision_30, 4),
        "recall_de_boundary": round(recall_30, 4),
        "confusion_matrix": cm,
        "roc_curve": roc_points,
        "calibration_curve": calib_points,
        "global_importance": global_importance,
        "total_records": len(df),
        "train_size": len(X_train),
        "val_size": len(X_val),
        "test_size": len(X_test),
        "default_rate": round(float(np.mean(y)), 4),
    }

    # Save artifacts
    model_bundle = {
        "calibrated_model": calibrated_model,
        "base_model": xgb,
        "feature_names": FEATURE_NAMES,
        "metrics": metrics,
    }
    joblib.dump(model_bundle, MODEL_PATH)

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Model Card
    model_card_content = f"""# Model Card: Saakh Credit Risk Model (XGBoost + Platt Scaling)
**Version:** xgb-2026.11-v1  
**Target:** 12-month loan default probability (`default_12m`)  
**Architecture:** Monotonically constrained gradient boosted trees (`XGBClassifier`) with sigmoid Platt calibration.

## Performance Metrics (Test Split, 15%)
- **Test ROC AUC:** {metrics['auc']} (Requirement: >= 0.80)
- **Brier Score:** {metrics['brier']} (Requirement: <= 0.11)
- **Kolmogorov-Smirnov (KS):** {metrics['ks']}
- **Baseline Logistic Regression AUC:** {metrics['baseline_auc']}

## Feature Schema & Monotone Constraints
- Ordered Feature Vector ({len(FEATURE_NAMES)} features):
{chr(10).join(f"- `{f}` (constraint: {MONOTONE_CONSTRAINTS.get(f, 0)})" for f in FEATURE_NAMES)}

## Ethical Safeguards & Fairness
No protected personal attributes (gender, marital status, religion, caste, pin-code) are utilized in the model. All monotonicity constraints guarantee that adverse risk movements strictly align with credit fundamentals.
"""
    MODEL_CARD_PATH.write_text(model_card_content, encoding="utf-8")

    global _LOADED_MODEL_BUNDLE
    _LOADED_MODEL_BUNDLE = model_bundle

    return calibrated_model, metrics


def load_model_bundle() -> dict[str, Any]:
    """Load cached or saved model bundle."""
    global _LOADED_MODEL_BUNDLE
    if _LOADED_MODEL_BUNDLE is not None:
        return _LOADED_MODEL_BUNDLE
    if MODEL_PATH.exists():
        _LOADED_MODEL_BUNDLE = joblib.load(MODEL_PATH)
        return _LOADED_MODEL_BUNDLE
    raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}. Run training first.")


def predict_pd(app_or_vector: Any) -> float:
    """Predict calibrated Probability of Default (PD) in (0, 1).
    
    SPEC §F08.
    """
    bundle = load_model_bundle()
    calibrated_model = bundle["calibrated_model"]
    base_model = bundle["base_model"]

    if isinstance(app_or_vector, np.ndarray):
        vec = app_or_vector.reshape(1, -1)
    elif isinstance(app_or_vector, dict) and "vector" in app_or_vector:
        vec = app_or_vector["vector"].reshape(1, -1)
    else:
        feat = engineer_features(app_or_vector)
        vec = feat["vector"].reshape(1, -1)

    margin = float(base_model.predict(vec, output_margin=True)[0])
    prob = float(calibrated_model.prob_of_margin(margin))
    # Calibrated PD clamped in (0.0001, 0.9999) and rounded to 4 decimal places
    clamped = max(0.0001, min(0.9999, prob))
    return round(clamped, 4)
