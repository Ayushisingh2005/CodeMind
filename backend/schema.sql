-- Enable the pgvector extension (run once per database)
CREATE EXTENSION IF NOT EXISTS vector;

-- Stores each indexed repo
CREATE TABLE IF NOT EXISTS repos (
    id SERIAL PRIMARY KEY,
    full_name TEXT UNIQUE NOT NULL,       -- e.g. "username/reponame"
    indexed_at TIMESTAMP DEFAULT NOW()
);

-- Stores each code chunk (function/class) with its embedding
CREATE TABLE IF NOT EXISTS code_chunks (
    id SERIAL PRIMARY KEY,
    repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    function_name TEXT,
    line_start INTEGER,
    line_end INTEGER,
    content TEXT NOT NULL,                -- the actual code + docstring
    embedding VECTOR(1024),                -- all-MiniLM-L6-v2 produces 384-dim vectors
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS code_chunks_embedding_idx
    ON code_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Stores issue triage predictions for reference/audit
CREATE TABLE IF NOT EXISTS issue_predictions (
    id SERIAL PRIMARY KEY,
    repo_full_name TEXT NOT NULL,
    issue_number INTEGER NOT NULL,
    predicted_category TEXT NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
