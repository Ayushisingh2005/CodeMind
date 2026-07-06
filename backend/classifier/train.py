import json
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def clean_text(text: str) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)  # remove code blocks
    text = re.sub(r"http\S+", "", text)                      # remove URLs
    text = re.sub(r"[^a-zA-Z\s]", "", text)                  # remove special chars
    return text.lower().strip()


def train(data_file: str = "training_data.json", output_file: str = "issue_classifier.joblib"):
    with open(data_file, "r") as f:
        data = json.load(f)

    texts = [clean_text(item["text"]) for item in data]
    labels = [item["label"] for item in data]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words="english")),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])

    print("Training classifier...")
    pipeline.fit(X_train, y_train)

    print("\nEvaluation on held-out test set:")
    predictions = pipeline.predict(X_test)
    print(classification_report(y_test, predictions))

    joblib.dump(pipeline, output_file)
    print(f"\n✅ Model saved to {output_file}")


if __name__ == "__main__":
    train()
