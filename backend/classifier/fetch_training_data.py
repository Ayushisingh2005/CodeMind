import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]


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


def build_dataset(repo_configs: list[dict], output_file: str = "training_data.json", max_per_category: int = 150):
    from collections import defaultdict
    dataset = []
    category_counts = defaultdict(int)

    for config in repo_configs:
        repo = config["repo"]
        label_map = config["label_map"]
        print(f"\n=== Fetching from {repo} ===")
        for github_label, our_category in label_map.items():
            if category_counts[our_category] >= max_per_category:
                print(f"Skipping '{github_label}' — already have enough '{our_category}' examples")
                continue
            print(f"Fetching issues labeled '{github_label}'...")
            issues = fetch_labeled_issues(repo, github_label)
            count = 0
            for issue in issues:
                if "pull_request" in issue:
                    continue
                if category_counts[our_category] >= max_per_category:
                    break
                text = f"{issue.get('title', '')} {issue.get('body', '') or ''}"
                dataset.append({"text": text, "label": our_category})
                category_counts[our_category] += 1
                count += 1
            print(f"  → {count} issues added (total for '{our_category}': {category_counts[our_category]})")

    with open(output_file, "w") as f:
        json.dump(dataset, f, indent=2)
    print(f"\n✅ Saved {len(dataset)} total labeled examples to {output_file}")
    print(f"Category breakdown: {dict(category_counts)}")


if __name__ == "__main__":
    build_dataset([
        {
            "repo": "psf/requests",
            "label_map": {
                "Bug": "bug",
                "Feature Request": "feature_request",
                "Question/Not a bug": "question",
            },
        },
        {
            "repo": "pallets/flask",
            "label_map": {
                "bug": "bug",
                "question": "question",
            },
        },
        {
            "repo": "expressjs/express",
            "label_map": {
                "bug": "bug",
                "enhancement": "feature_request",
                "question": "question",
            },
        },
    ])
