from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.core import Prediction, PredictionOutcome


def calibrate_trend_forecast(db: Session, prediction_id: str | None = None) -> dict | None:
    query = db.query(Prediction, PredictionOutcome).join(
        PredictionOutcome,
        PredictionOutcome.prediction_id == Prediction.id,
    )
    if prediction_id:
        query = query.filter(Prediction.id == prediction_id)

    pairs = query.all()
    if prediction_id and not pairs:
        return None

    if not pairs:
        return {
            "prediction_id": prediction_id,
            "evaluated_predictions": 0,
            "average_confidence": 0.0,
            "average_accuracy": 0.0,
            "calibration_error": 0.0,
            "recommendation": "No resolved predictions are available yet.",
        }

    confidence_values = [prediction.confidence_score or 0.0 for prediction, _ in pairs]
    accuracy_values = [outcome.accuracy_score or _resolution_accuracy(outcome.resolution) for _, outcome in pairs]
    average_confidence = round(sum(confidence_values) / len(confidence_values), 3)
    average_accuracy = round(sum(accuracy_values) / len(accuracy_values), 3)
    calibration_error = round(abs(average_confidence - average_accuracy), 3)

    if calibration_error <= 0.1:
        recommendation = "Forecast confidence is well calibrated against recorded outcomes."
    elif average_confidence > average_accuracy:
        recommendation = "Reduce future confidence until stronger evidence is available."
    else:
        recommendation = "Forecasts are conservative; confidence can increase when evidence is strong."

    return {
        "prediction_id": prediction_id,
        "evaluated_predictions": len(pairs),
        "average_confidence": average_confidence,
        "average_accuracy": average_accuracy,
        "calibration_error": calibration_error,
        "recommendation": recommendation,
    }


def _resolution_accuracy(resolution: str) -> float:
    normalized = resolution.lower()
    if normalized in {"realized", "true", "confirmed"}:
        return 1.0
    if normalized in {"partial", "partially_realized"}:
        return 0.5
    return 0.0
