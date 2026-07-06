import os
import psycopg2
from psycopg2.extras import RealDictCursor
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    """Returns a new Postgres connection with pgvector support registered."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    register_vector(conn)
    return conn


def init_schema():
    """Runs schema.sql to create tables/extension if they don't exist yet."""
    with open("schema.sql", "r") as f:
        sql = f.read()
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    conn.close()
    print("✅ Schema initialized.")


if __name__ == "__main__":
    init_schema()
