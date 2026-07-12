import os
import joblib
from classifier.train import clean_text

_pipeline = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), "issue_classifier.joblib")


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline


def predict_category(title: str, body: str) -> dict:
    pipeline = get_pipeline()
    text = clean_text(f"{title} {body or ''}")
    category = pipeline.predict([text])[0]
    probabilities = pipeline.predict_proba([text])[0]
    confidence = max(probabilities)
    return {"category": category, "confidence": float(confidence)}

