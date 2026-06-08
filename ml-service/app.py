from pathlib import Path
import pickle
import warnings

import numpy as np
from flask import Flask, jsonify, request
from sklearn.exceptions import InconsistentVersionWarning


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

TASKS = {
    "fake_news": {
        "model": MODEL_DIR / "fake_news_model.pkl",
        "vectorizer": MODEL_DIR / "fake_news_vectorizer.pkl",
        "risk_class": 0,
        "positive_label": "Likely Fake News",
        "negative_label": "Likely Real News",
        "keywords": [
            "shocking",
            "unbelievable",
            "secret",
            "won't believe",
            "breaking",
            "exclusive",
            "conspiracy",
            "miracle",
        ],
        "keyword_explanation": "Sensational phrasing is common in misleading articles.",
        "default_explanation": "The article wording matches patterns learned from the training data.",
        "safety_tip": "Verify the claim with at least two trusted sources before sharing.",
    },
    "spam": {
        "model": MODEL_DIR / "spam_model.pkl",
        "vectorizer": MODEL_DIR / "spam_vectorizer.pkl",
        "risk_class": 1,
        "positive_label": "Spam Message",
        "negative_label": "Not Spam",
        "keywords": [
            "click",
            "win",
            "prize",
            "congratulations",
            "free",
            "urgent",
            "claim",
            "offer",
            "buy now",
        ],
        "keyword_explanation": "Promotional or urgent phrases are common in spam messages.",
        "default_explanation": "The message wording matches patterns learned from the training data.",
        "safety_tip": "Do not open links or attachments until the sender is verified.",
    },
}

app = Flask(__name__)
ARTIFACTS = {}

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)


def load_artifacts():
    for task, config in TASKS.items():
        with open(config["model"], "rb") as model_file:
            model = pickle.load(model_file)
        with open(config["vectorizer"], "rb") as vectorizer_file:
            vectorizer = pickle.load(vectorizer_file)
        ARTIFACTS[task] = {"model": model, "vectorizer": vectorizer}


def normalize_task(task):
    return task if task in TASKS else "fake_news"


def to_native(value):
    try:
        return value.item()
    except AttributeError:
        return value


def risk_level(score):
    if score is None:
        return "unknown"
    if score >= 75:
        return "high"
    if score >= 45:
        return "medium"
    return "low"


def risk_probability(model, vector, task):
    if not hasattr(model, "predict_proba"):
        return None

    probabilities = model.predict_proba(vector)[0]
    classes = list(getattr(model, "classes_", []))
    risk_class = TASKS[task]["risk_class"]

    if risk_class in classes:
        probability = probabilities[classes.index(risk_class)]
    elif len(probabilities) == 2:
        probability = 1.0 - probabilities[0]
    else:
        probability = probabilities.max()

    return round(float(probability) * 100.0, 1)


def label_for(task, prediction, score=None, threshold=None):
    config = TASKS[task]
    risk_class = config["risk_class"]

    if threshold is not None and score is not None:
        is_risky = score >= threshold
    else:
        is_risky = to_native(prediction) == risk_class

    return config["positive_label"] if is_risky else config["negative_label"], is_risky


def signal_words(model, vectorizer, vector, prediction):
    if not hasattr(model, "coef_") or not hasattr(vectorizer, "get_feature_names_out"):
        return []

    try:
        features = vectorizer.get_feature_names_out()
        coefficients = np.array(model.coef_)
        dense_vector = vector.toarray()[0]
        classes = list(getattr(model, "classes_", []))
        native_prediction = to_native(prediction)

        if coefficients.ndim == 2 and coefficients.shape[0] > 1 and native_prediction in classes:
            coefficient_row = coefficients[classes.index(native_prediction)]
        elif coefficients.ndim == 2:
            coefficient_row = coefficients[0]
            if native_prediction in classes and classes.index(native_prediction) == 0:
                coefficient_row = -coefficient_row
        else:
            coefficient_row = coefficients

        contributions = coefficient_row * dense_vector
        top_indexes = np.argsort(contributions)[-6:][::-1]
        return [features[index] for index in top_indexes if dense_vector[index] > 0][:5]
    except Exception:
        return []


def explanation_for(task, text, signals):
    if signals:
        return f"Important text signals: {', '.join(signals)}."

    config = TASKS[task]
    lowered = text.lower()
    found = [keyword for keyword in config["keywords"] if keyword in lowered]
    if found:
        return f"{config['keyword_explanation']} Found: {', '.join(found[:3])}."
    return config["default_explanation"]


def predict_record(task, text, threshold=None):
    task = normalize_task(task)
    text = str(text or "").strip()
    if not text:
        raise ValueError("Text is required for prediction.")

    artifact = ARTIFACTS[task]
    model = artifact["model"]
    vectorizer = artifact["vectorizer"]
    vector = vectorizer.transform([text])
    prediction = model.predict(vector)[0]
    score = risk_probability(model, vector, task)
    label, is_risky = label_for(task, prediction, score, threshold)
    signals = signal_words(model, vectorizer, vector, prediction)

    return {
        "task": task,
        "label": label,
        "rawPrediction": to_native(prediction),
        "riskScore": score,
        "riskLevel": risk_level(score),
        "isRisky": is_risky,
        "signals": signals,
        "explanation": explanation_for(task, text, signals),
        "safetyTip": TASKS[task]["safety_tip"],
        "textLength": len(text),
    }


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "tasks": list(TASKS.keys()),
            "modelsLoaded": sorted(ARTIFACTS.keys()),
        }
    )


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    task = normalize_task(payload.get("task"))
    threshold = payload.get("threshold")
    try:
        threshold = float(threshold) if threshold not in (None, "") else None
    except (TypeError, ValueError):
        threshold = None

    try:
        result = predict_record(task, payload.get("text") or payload.get("message"), threshold)
        return jsonify(result)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": f"Prediction failed: {error}"}), 500


@app.post("/predict-batch")
def predict_batch():
    payload = request.get_json(silent=True) or {}
    task = normalize_task(payload.get("task"))
    texts = payload.get("texts") or []
    threshold = payload.get("threshold")

    try:
        threshold = float(threshold) if threshold not in (None, "") else None
    except (TypeError, ValueError):
        threshold = None

    if not isinstance(texts, list) or not texts:
        return jsonify({"error": "A non-empty texts array is required."}), 400

    try:
        predictions = [predict_record(task, text, threshold) for text in texts]
        return jsonify({"task": task, "count": len(predictions), "predictions": predictions})
    except Exception as error:
        return jsonify({"error": f"Batch prediction failed: {error}"}), 500


load_artifacts()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5055, debug=False, use_reloader=False)
