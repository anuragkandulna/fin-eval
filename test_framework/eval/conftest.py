import os
import sys
import pytest
import httpx
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

API_URL   = os.getenv("API_URL",    "http://localhost:8000")
LLM_JUDGE = os.getenv("EVAL_MODEL", "gpt-4o-mini")

_TIMEOUT = httpx.Timeout(connect=10, read=90, write=10, pool=10)


@pytest.fixture(scope="session")
def api_url() -> str:
    return API_URL


def _chat_full(message: str, session_id: str = "eval") -> dict:
    """POST /chat and return the full JSON response dict (includes retrieved_context)."""
    r = httpx.post(
        f"{API_URL}/chat",
        json={"message": message, "session_id": session_id, "context_docs": []},
        timeout=_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


# ── MLflow session teardown ────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def _mlflow_report(request):
    """Collect passing metric scores and ship to MLflow at end of session."""
    scores: dict[str, float] = {}
    yield scores

    if not os.getenv("MLFLOW_TRACKING_URI"):
        return  # MLflow logging is opt-in via env var

    try:
        import tracker
        tracker.log_eval_run(
            metrics=scores,
            params={
                "PROMPT_VERSION": "v3",
                "EVAL_MODEL": LLM_JUDGE,
                "API_URL": API_URL,
            },
        )
    except Exception as exc:
        print(f"[conftest] MLflow teardown failed (non-fatal): {exc}")
