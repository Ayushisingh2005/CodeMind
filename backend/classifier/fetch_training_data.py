import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]

# Map GitHub's own label names to our simplified categories.
# Adjust these to match the labels used in whichever repo you pull from.
LABEL_MAP = {
    "bug": "bug",
    "enhancement": "feature_request",
    "question": "question",
    "duplicate": "duplicate",
}


def fetch_labeled_issues(repo: str, label: str, max_pages: int = 5):
    issues = []
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    for page in range(1, max_pages + 1):
        url = f"https://api.github.com/repos/{repo}/issues"
        params = {"labels": label, "state": "all", "per_page": 100, "page": page}
        resp = requests.get(url, headers=headers, params=params)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        issues.extend(batch)
    return issues


def build_dataset(repo: str, output_file: str = "training_data.json"):
    dataset = []
    for github_label, our_category in LABEL_MAP.items():
        print(f"Fetching issues labeled '{github_label}'...")
        issues = fetch_labeled_issues(repo, github_label)
        for issue in issues:
            if "pull_request" in issue:
                continue  # skip PRs, we only want issues
            text = f"{issue.get('title', '')} {issue.get('body', '') or ''}"
            dataset.append({"text": text, "label": our_category})
        print(f"  → {len(issues)} issues found")

    with open(output_file, "w") as f:
        json.dump(dataset, f, indent=2)
    print(f"✅ Saved {len(dataset)} labeled examples to {output_file}")


if __name__ == "__main__":
    # Example: use a large public repo with well-maintained labels
    build_dataset("facebook/react")
