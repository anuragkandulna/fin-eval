import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

API_URL       = os.getenv("API_URL", "http://localhost:8000")
LOAD_USERS    = int(os.getenv("LOAD_USERS", "20"))
LOAD_DURATION = int(os.getenv("LOAD_DURATION", "60"))
P95_THRESHOLD = int(os.getenv("LOCUST_P95_MS", "20000"))  # LLM endpoints: 20s realistic
CSV_OUTPUT    = "data/results.csv"
REPORT_OUTPUT = "reports/load_report.html"

ENDPOINTS = {
    "health": {
        "method": "GET",
        "path":   "/health",
        "body":   None,
    },
    # /chat is excluded from load tests — LLM round-trips (5-15s) are too slow
    # for concurrent load; its quality is validated by the eval suite instead.
    "analyse": {
        "method": "POST",
        "path":   "/analyse",
        "body":   {
            "income":          80000,
            "needs":           35000,
            "wants":           20000,
            "current_savings": 25000,
            "savings_goal":    16000,
            "debts":           [],
            "monthly_debt_payment": 0,
            "projection_years": 10,
            "annual_return":   0.08,
            "session_id":      "load-test",
        },
    },
}
