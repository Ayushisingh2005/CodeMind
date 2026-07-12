from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from indexer import index_repo
from chat import answer_question
from webhook import router as webhook_router

load_dotenv()

app = FastAPI(title="CodeMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router)


class IndexRequest(BaseModel):
    repo_full_name: str  # e.g. "username/reponame"


class ChatRequest(BaseModel):
    repo_full_name: str
    question: str


@app.get("/")
def health_check():
    return {"status": "ok", "service": "CodeMind API"}


@app.post("/index")
def index_repository(req: IndexRequest):
    try:
        github_token = os.environ.get("GITHUB_TOKEN")
        chunk_count = index_repo(req.repo_full_name, github_token)
        return {"status": "success", "chunks_indexed": chunk_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        result = answer_question(req.repo_full_name, req.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

