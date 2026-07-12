import hashlib
import hmac
import os
import requests
from fastapi import APIRouter, Request, HTTPException
from classifier.predict import predict_category
from db import get_connection

router = APIRouter()

GITHUB_WEBHOOK_SECRET = os.environ["GITHUB_WEBHOOK_SECRET"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]

CONFIDENCE_THRESHOLD = 0.6  # only auto-label if the model is reasonably confident


def verify_signature(payload_body: bytes, signature_header: str) -> bool:
    if not signature_header:
        return False
    expected = "sha256=" + hmac.new(
        GITHUB_WEBHOOK_SECRET.encode(), payload_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def apply_label(repo_full_name: str, issue_number: int, label: str):
    url = f"https://api.github.com/repos/{repo_full_name}/issues/{issue_number}/labels"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }
    requests.post(url, headers=headers, json={"labels": [label]})


@router.post("/webhook/issues")
async def handle_issue_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-hub-signature-256", "")

    if not verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()

    if payload.get("action") != "opened":
        return {"status": "ignored", "reason": "not an 'opened' issue event"}

    issue = payload["issue"]
    repo_full_name = payload["repository"]["full_name"]
    issue_number = issue["number"]
    title = issue.get("title", "")
    issue_body = issue.get("body", "") or ""

    result = predict_category(title, issue_body)
    category = result["category"]
    confidence = result["confidence"]

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO issue_predictions (repo_full_name, issue_number, predicted_category, confidence)
            VALUES (%s, %s, %s, %s)
            """,
            (repo_full_name, issue_number, category, confidence),
        )
    conn.commit()
    conn.close()

    if confidence >= CONFIDENCE_THRESHOLD:
        apply_label(repo_full_name, issue_number, category)
        return {"status": "labeled", "category": category, "confidence": confidence}

    return {"status": "low_confidence", "category": category, "confidence": confidence}

