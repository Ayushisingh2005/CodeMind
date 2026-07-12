import json
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def clean_text(text: str) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    return text.lower().strip()


def train(data_file: str = "training_data.json", output_file: str = "issue_classifier.joblib"):
    with open(data_file, "r") as f:
        data = json.load(f)

    texts = [clean_text(item["text"]) for item in data]
    labels = [item["label"] for item in data]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    vectorizer_params = dict(
        max_features=8000,
        ngram_range=(1, 3),
        stop_words="english",
        sublinear_tf=True,  # dampens the effect of very frequent words
        min_df=2,           # ignore words that appear in only 1 document (noise)
    )

    # Try Logistic Regression
    lr_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(**vectorizer_params)),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", C=1.0)),
    ])
    lr_pipeline.fit(X_train, y_train)
    lr_preds = lr_pipeline.predict(X_test)

    # Try Linear SVM (often stronger on small text datasets), wrapped for probability support
    svm_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(**vectorizer_params)),
        ("classifier", CalibratedClassifierCV(LinearSVC(class_weight="balanced", C=1.0))),
    ])
    svm_pipeline.fit(X_train, y_train)
    svm_preds = svm_pipeline.predict(X_test)

    print("=== Logistic Regression ===")
    print(classification_report(y_test, lr_preds))

    print("=== Linear SVM ===")
    print(classification_report(y_test, svm_preds))

    # Pick whichever scored higher on weighted F1
    from sklearn.metrics import f1_score
    lr_f1 = f1_score(y_test, lr_preds, average="weighted")
    svm_f1 = f1_score(y_test, svm_preds, average="weighted")

    best_pipeline = svm_pipeline if svm_f1 > lr_f1 else lr_pipeline
    best_name = "SVM" if svm_f1 > lr_f1 else "Logistic Regression"
    print(f"\n🏆 Best model: {best_name} (F1: {max(lr_f1, svm_f1):.3f})")

    joblib.dump(best_pipeline, output_file)
    print(f"✅ Model saved to {output_file}")


if __name__ == "__main__":
    train()
