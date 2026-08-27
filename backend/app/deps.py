from app.database import get_db as get_db  # noqa: F401 — re-export for dependency injection
from app.agent.graph import finance_agent as _finance_agent


def get_agent():
    return _finance_agent
