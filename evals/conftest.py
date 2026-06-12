import pytest
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def client():
    return httpx.Client(base_url=BACKEND_URL, timeout=30.0)


@pytest.fixture(scope="session")
def test_cases():
    path = os.path.join(os.path.dirname(__file__), "synthetic_data", "test_cases.json")
    with open(path) as f:
        return json.load(f)


def invoke_chat(client: httpx.Client, question: str) -> dict:
    resp = client.post("/chat", json={
        "message": question,
        "session_id": "eval-session",
        "context_docs": [],
    })
    resp.raise_for_status()
    return resp.json()


def invoke_recommend(client: httpx.Client, loan_data: dict) -> dict:
    resp = client.post("/recommend", json=loan_data)
    resp.raise_for_status()
    return resp.json()
