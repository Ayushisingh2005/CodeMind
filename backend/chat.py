import os
import time
import requests
from indexer import embed_text
from db import get_connection


def retrieve_relevant_chunks(repo_full_name: str, question: str, top_k: int = 5):
    """Embeds the question and finds the most similar code chunks via pgvector."""
    query_embedding = embed_text(question)

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT cc.content, cc.file_path, cc.function_name, cc.line_start, cc.line_end
            FROM code_chunks cc
            JOIN repos r ON cc.repo_id = r.id
            WHERE r.full_name = %s
            ORDER BY cc.embedding <=> %s::vector
            LIMIT %s
            """,
            (repo_full_name, query_embedding, top_k),
        )
        results = cur.fetchall()
    conn.close()
    return results


GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


def call_groq(prompt: str, retries: int = 3) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }

    for attempt in range(retries):
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 429:
            wait_time = 10 * (attempt + 1)
            print(f"Groq rate limited, waiting {wait_time}s before retry...", flush=True)
            time.sleep(wait_time)
            continue
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    raise RuntimeError("Groq generation failed after multiple retries due to rate limiting.")


def answer_question(repo_full_name: str, question: str) -> dict:
    """Full RAG pipeline: retrieve relevant chunks, then generate a grounded answer."""
    chunks = retrieve_relevant_chunks(repo_full_name, question)

    if not chunks:
        return {
            "answer": "No indexed code found for this repo yet. Please index it first.",
            "sources": [],
        }

    context_blocks = []
    for c in chunks:
        location = f"{c['file_path']}:{c['line_start']}-{c['line_end']}"
        context_blocks.append(f"[{location}]\n{c['content']}")
    context_text = "\n\n---\n\n".join(context_blocks)

    prompt = f"""You are a code assistant answering questions about a codebase.
Answer the question using ONLY the context below. Cite the file and line numbers
for any claim you make. If the context doesn't contain the answer, say so honestly.

Context:
{context_text}

Question: {question}
"""

    answer = call_groq(prompt)

    sources = [
        {
            "file_path": c["file_path"],
            "function_name": c["function_name"],
            "line_start": c["line_start"],
            "line_end": c["line_end"],
        }
        for c in chunks
    ]

    return {"answer": answer, "sources": sources}
    
