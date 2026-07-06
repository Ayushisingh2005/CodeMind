import ast
import os
import shutil
import tempfile
import time
import requests
from git import Repo
from db import get_connection

COHERE_API_KEY = os.environ.get("COHERE_API_KEY")
COHERE_EMBED_URL = "https://api.cohere.com/v1/embed"


def embed_batch(texts: list[str], input_type: str = "search_document",
                 batch_size: int = 90, pace_seconds: float = 13.0):
    """
    Embeds a list of texts using Cohere's embed API, sending many texts
    per API call (much faster than one-at-a-time) while pacing batches
    to respect the free trial's rate limit.
    """
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json",
    }
    all_embeddings = []
    total_batches = (len(texts) + batch_size - 1) // batch_size

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        payload = {
            "model": "embed-english-v3.0",
            "texts": [t[:2000] for t in batch],  # keep each text within token limits
            "input_type": input_type,
        }
        resp = requests.post(COHERE_EMBED_URL, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        all_embeddings.extend(data["embeddings"])

        batch_num = i // batch_size + 1
        print(f"  Embedded batch {batch_num}/{total_batches} "
              f"({len(all_embeddings)}/{len(texts)} chunks)...", flush=True)

        if batch_num < total_batches:
            time.sleep(pace_seconds)

    return all_embeddings


def embed_text(text: str):
    """Embeds a single piece of text — used for embedding a user's chat question."""
    return embed_batch([text], input_type="search_query")[0]


def extract_python_chunks(file_path: str, source: str):
    """
    Parses a Python file's AST and extracts each function/class definition
    as a separate chunk, along with its docstring, name, and line numbers.
    """
    chunks = []
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return chunks  # skip files that don't parse (e.g. Python 2 syntax)

    source_lines = source.splitlines()

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            start = node.lineno - 1
            end = getattr(node, "end_lineno", start + 1)
            code_text = "\n".join(source_lines[start:end])
            docstring = ast.get_docstring(node) or ""

            chunks.append({
                "file_path": file_path,
                "function_name": node.name,
                "line_start": node.lineno,
                "line_end": end,
                "content": f"{docstring}\n\n{code_text}".strip(),
            })

    return chunks


def index_repo(repo_full_name: str, github_token: str = None):
    """
    Clones a GitHub repo, extracts code chunks from every .py file,
    embeds them, and stores them in pgvector.

    max_chunks caps how many chunks get embedded — useful while testing
    against a free-tier API rate limit. Set to None to index everything.
    """
    tmp_dir = tempfile.mkdtemp()
    clone_url = f"https://github.com/{repo_full_name}.git"
    if github_token:
        clone_url = f"https://{github_token}@github.com/{repo_full_name}.git"

    print(f"Cloning {repo_full_name}...")
    Repo.clone_from(clone_url, tmp_dir, depth=1)

    all_chunks = []
    for root, _, files in os.walk(tmp_dir):
        if ".git" in root:
            continue
        for fname in files:
            if not fname.endswith(".py"):
                continue
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, tmp_dir)
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    source = f.read()
            except Exception:
                continue
            all_chunks.extend(extract_python_chunks(rel_path, source))

    print(f"Extracted {len(all_chunks)} code chunks total.")
    print("Embedding via Cohere API (batched)...")
    texts = [c["content"] for c in all_chunks]
    embeddings = embed_batch(texts) if texts else []
    print("Embedding complete.")

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO repos (full_name) VALUES (%s) "
            "ON CONFLICT (full_name) DO UPDATE SET indexed_at = NOW() "
            "RETURNING id",
            (repo_full_name,),
        )
        repo_id = cur.fetchone()["id"]

        # Clear old chunks for this repo before re-indexing
        cur.execute("DELETE FROM code_chunks WHERE repo_id = %s", (repo_id,))

        for chunk, embedding in zip(all_chunks, embeddings):
            cur.execute(
                """
                INSERT INTO code_chunks
                    (repo_id, file_path, function_name, line_start, line_end, content, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    repo_id,
                    chunk["file_path"],
                    chunk["function_name"],
                    chunk["line_start"],
                    chunk["line_end"],
                    chunk["content"],
                    embedding,
                ),
            )
    conn.commit()
    conn.close()

    shutil.rmtree(tmp_dir, ignore_errors=True)
    print(f"✅ Indexed {len(all_chunks)} chunks for {repo_full_name}")
    return len(all_chunks)