# Section 09 — Eval: Playwright E2E Tests
**Goal:** 3 E2E test scenarios covering chat, finance form, and document upload

---

## Step 9.1 — Install Playwright

```bash
pip install pytest-playwright==0.5.0
playwright install chromium
```

---

## Step 9.2 — playwright_tests/test_chat_flow.py

```python
import pytest
from playwright.sync_api import sync_playwright, expect

BASE_URL = "https://app.domain.com"   # or http://localhost:3000 for local

def test_chat_question_and_response():
    """User asks a personal finance question and gets a response."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        # Type question
        page.fill('[data-testid="chat-input"]', "What is the 50/30/20 budgeting rule?")
        page.click('[data-testid="send-button"]')
        
        # Wait for response (allow up to 20s for LLM)
        page.wait_for_selector('[data-testid="assistant-message"]', timeout=20000)
        
        response = page.text_content('[data-testid="assistant-message"]')
        
        # Assertions
        assert len(response) > 20, "Response too short"
        assert any(term in response.lower() for term in ["580", "credit", "fha", "score"]), \
            f"Response doesn't mention expected terms: {response[:100]}"
        
        browser.close()

def test_loading_indicator_appears():
    """Loading indicator shows while waiting for response."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        page.fill('[data-testid="chat-input"]', "What is personal finance?")
        page.click('[data-testid="send-button"]')
        
        # Loading indicator should appear briefly
        page.wait_for_selector('[data-testid="loading-indicator"]', timeout=3000)
        
        # Then disappear
        page.wait_for_selector('[data-testid="loading-indicator"]',
                               state="detached", timeout=20000)
        
        browser.close()

def test_empty_input_does_not_send():
    """Send button should be disabled when input is empty."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        send_button = page.locator('[data-testid="send-button"]')
        expect(send_button).to_be_disabled()
        
        browser.close()

def test_multiple_messages():
    """Multiple messages maintain conversation."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        for question in ["What is an FHA loan?", "What is the minimum credit score?"]:
            page.fill('[data-testid="chat-input"]', question)
            page.click('[data-testid="send-button"]')
            page.wait_for_selector('[data-testid="assistant-message"]:last-child',
                                   timeout=20000)
        
        messages = page.locator('[data-testid="assistant-message"]').all()
        assert len(messages) >= 2, "Expected at least 2 assistant messages"
        
        browser.close()
```

---

## Step 9.3 — playwright_tests/test_loan_form.py

```python
from playwright.sync_api import sync_playwright, expect

BASE_URL = "https://app.domain.com/loan"

def test_eligible_loan_recommendation():
    """Good credit profile should return eligible recommendation."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        page.fill('[data-testid="income"]', "90000")
        page.fill('[data-testid="loan-amount"]', "300000")
        page.fill('[data-testid="credit-score"]', "750")
        page.select_option('[data-testid="loan-type"]', "fixed")
        page.click('[data-testid="submit-loan"]')
        
        page.wait_for_selector('[data-testid="recommendation-card"]', timeout=20000)
        
        status = page.text_content('[data-testid="eligibility-status"]')
        assert "eligible" in status.lower()
        
        browser.close()

def test_ineligible_low_credit():
    """Low credit score should return not eligible."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        page.fill('[data-testid="income"]', "50000")
        page.fill('[data-testid="loan-amount"]', "400000")
        page.fill('[data-testid="credit-score"]', "500")
        page.select_option('[data-testid="loan-type"]', "conventional")
        page.click('[data-testid="submit-loan"]')
        
        page.wait_for_selector('[data-testid="recommendation-card"]', timeout=20000)
        
        status = page.text_content('[data-testid="eligibility-status"]')
        assert "not eligible" in status.lower()
        
        browser.close()

def test_recommendation_contains_rate():
    """Recommendation must show an interest rate."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        page.fill('[data-testid="income"]', "80000")
        page.fill('[data-testid="loan-amount"]', "320000")
        page.fill('[data-testid="credit-score"]', "680")
        page.select_option('[data-testid="loan-type"]', "fha")
        page.click('[data-testid="submit-loan"]')
        
        page.wait_for_selector('[data-testid="recommendation-card"]', timeout=20000)
        
        card_text = page.text_content('[data-testid="recommendation-card"]')
        assert "%" in card_text, "Rate not shown in recommendation"
        
        browser.close()
```

---

## Step 9.4 — playwright_tests/test_document_upload.py

```python
from playwright.sync_api import sync_playwright
import os, tempfile

BASE_URL = "https://app.domain.com/upload"

def test_pdf_upload_success():
    """Uploading a valid PDF should confirm processing."""
    # Create a minimal test PDF
    test_pdf_path = create_test_pdf()
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(BASE_URL)
        
        page.set_input_files('[data-testid="file-upload"]', test_pdf_path)
        page.click('[data-testid="upload-button"]')
        
        page.wait_for_selector('[data-testid="upload-status"]', timeout=15000)
        
        status = page.text_content('[data-testid="upload-status"]')
        assert "processed" in status.lower() or "success" in status.lower()
        
        browser.close()
    
    os.unlink(test_pdf_path)

def create_test_pdf() -> str:
    """Create a minimal valid PDF for testing."""
    content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref\n0 4\n0000000000 65535 f\n
trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"""
    
    f = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    f.write(content)
    f.close()
    return f.name
```

---

## Section 09 Checklist

- [ ] Playwright installed + Chromium browser downloaded
- [ ] `data-testid` attributes on all frontend elements (verify from Section 06)
- [ ] Chat flow tests — at least 3 passing
- [ ] Finance form tests — eligible + ineligible cases pass
- [ ] Document upload test passing
- [ ] All test files use `BASE_URL` env var (not hardcoded)
- [ ] Local run: `pytest evals/playwright_tests/ -v`
- [ ] Commit: `git commit -m "feat: Playwright E2E tests — chat, loan, upload"`

---

---

# Section 10 — Eval: Locust + Lighthouse
**Goal:** Load test + frontend quality score, both generating reports

---

## Step 10.1 — performance/locustfile.py

```python
from locust import HttpUser, task, between
import random

CHAT_QUESTIONS = [
    "What is the 50/30/20 budgeting rule?",
    "What is DTI ratio?",
    "Explain PMI",
    "What is an ARM loan?",
    "What is the difference between APR and interest rate?",
]

LOAN_PROFILES = [
    {"income": 80000, "loan_amount": 320000, "credit_score": 720, "loan_type": "fixed", "employment": "employed"},
    {"income": 60000, "loan_amount": 250000, "credit_score": 650, "loan_type": "fha",   "employment": "employed"},
    {"income": 120000,"loan_amount": 500000, "credit_score": 780, "loan_type": "fixed", "employment": "self_employed"},
]

class FinanceAPIUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(4)
    def ask_finance_question(self):
        """Main task — chat endpoint (higher weight)."""
        self.client.post("/chat", json={
            "message": random.choice(CHAT_QUESTIONS),
            "session_id": f"load-{self.user_id}",
            "context_docs": []
        }, name="/chat")
    
    @task(2)
    def get_loan_recommendation(self):
        """Loan recommendation endpoint."""
        self.client.post("/recommend",
                         json=random.choice(LOAN_PROFILES),
                         name="/recommend")
    
    @task(1)
    def health_check(self):
        """Health endpoint — baseline."""
        self.client.get("/health", name="/health")

# Run command (add to README):
# locust -f evals/performance/locustfile.py \
#   --host=https://app.domain.com \
#   --users=50 --spawn-rate=5 \
#   --run-time=120s --headless \
#   --html=evals/reports/locust/index.html \
#   --csv=evals/reports/locust/results
#
# Pass criteria:
# - p95 latency /chat < 5000ms (LLM is slow)
# - p95 latency /health < 200ms
# - Error rate < 1%
```

---

## Step 10.2 — performance/lighthouse_runner.py

```python
import subprocess, json, os, shutil

URLS_TO_TEST = [
    "https://app.domain.com",
    "https://app.domain.com/loan",
    "https://test.domain.com",
]

LIGHTHOUSE_THRESHOLDS = {
    "performance": 70,
    "accessibility": 85,
    "best-practices": 80,
}

def run_lighthouse(url: str, output_dir: str) -> dict:
    """Run Lighthouse on a URL and return scores."""
    os.makedirs(output_dir, exist_ok=True)
    
    result = subprocess.run([
        "npx", "lighthouse", url,
        "--output=json",
        "--output=html",
        f"--output-path={output_dir}/report",
        "--chrome-flags=--headless --no-sandbox",
        "--quiet"
    ], capture_output=True, text=True)
    
    json_path = f"{output_dir}/report.report.json"
    if not os.path.exists(json_path):
        print(f"Lighthouse failed for {url}: {result.stderr}")
        return {}
    
    with open(json_path) as f:
        data = json.load(f)
    
    categories = data.get("categories", {})
    scores = {k: round(v["score"] * 100) for k, v in categories.items()}
    return scores

def run_all(output_base: str = "evals/reports/lighthouse"):
    summary = {}
    
    for url in URLS_TO_TEST:
        slug = url.replace("https://", "").replace("/", "_").replace(".", "-")
        scores = run_lighthouse(url, f"{output_base}/{slug}")
        summary[url] = scores
        
        # Check thresholds
        for category, minimum in LIGHTHOUSE_THRESHOLDS.items():
            actual = scores.get(category, 0)
            status = "✅" if actual >= minimum else "❌"
            print(f"  {status} {category}: {actual} (min: {minimum})")
    
    # Save summary
    with open(f"{output_base}/summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    
    return summary

if __name__ == "__main__":
    run_all()
```

---

## Step 10.3 — Parse Locust CSV into summary JSON

Add to `evals/scripts/parse_locust.py`:

```python
import csv, json, os

def parse_locust_stats(csv_path: str, output_path: str):
    if not os.path.exists(csv_path):
        print(f"Locust stats not found at {csv_path}")
        return {}
    
    summary = {"endpoints": {}}
    
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("Name", "unknown")
            if name == "Aggregated":
                summary.update({
                    "p50_ms":      int(float(row.get("50%", 0))),
                    "p95_ms":      int(float(row.get("95%", 0))),
                    "p99_ms":      int(float(row.get("99%", 0))),
                    "rps":         float(row.get("Requests/s", 0)),
                    "error_rate":  float(row.get("Failure Rate", 0)),
                    "total_reqs":  int(row.get("Request Count", 0)),
                })
            else:
                summary["endpoints"][name] = {
                    "p95_ms": int(float(row.get("95%", 0))),
                    "rps":    float(row.get("Requests/s", 0)),
                    "errors": int(row.get("Failure Count", 0)),
                }
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(summary, f, indent=2)
    
    return summary
```

---

## Section 10 Checklist

- [ ] `locustfile.py` with 3 tasks and weighted distribution
- [ ] `lighthouse_runner.py` testing both app and test dashboard URLs
- [ ] `parse_locust.py` converting CSV to JSON summary
- [ ] Local Locust test: `locust -f evals/performance/locustfile.py --host=http://localhost:8000 --users=10 --spawn-rate=2 --run-time=30s --headless`
- [ ] Locust HTML report generated
- [ ] Lighthouse runner produces JSON scores
- [ ] Commit: `git commit -m "feat: Locust load tests + Lighthouse runner"`

---

---

# Section 11 — MLflow on VPS
**Goal:** Live MLflow server accessible at mlflow.domain.com

---

## Step 11.1 — mlflow_server/docker-compose.yml

```yaml
version: '3.8'

services:
  mlflow:
    image: python:3.11-slim
    command: >
      bash -c "pip install mlflow psycopg2-binary -q &&
               mlflow server
               --backend-store-uri postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/mlflow
               --default-artifact-root /mlflow/artifacts
               --host 0.0.0.0
               --port 5000"
    ports:
      - "5000:5000"
    volumes:
      - mlflow_artifacts:/mlflow/artifacts
    environment:
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

volumes:
  mlflow_artifacts:
```

This is already included in the root `docker-compose.yml` from Section 02. MLflow starts automatically with `docker compose up`.

---

## Step 11.2 — Create MLflow database

```bash
# On VPS, after docker compose up
docker compose exec postgres psql -U ${DB_USER} -c "CREATE DATABASE mlflow;"
```

---

## Step 11.3 — Test MLflow connection locally

```bash
# Set tracking URI
export MLFLOW_TRACKING_URI=http://localhost:5000

# Create a test run
python -c "
import mlflow
mlflow.set_tracking_uri('http://localhost:5000')
mlflow.set_experiment('test')
with mlflow.start_run():
    mlflow.log_metric('test_score', 0.85)
print('MLflow connection OK')
"
```

---

## Step 11.4 — Create experiment on first run

```python
# Add to evals/mlflow_logger/tracker.py

def setup_experiment():
    """Create experiment if it doesn't exist."""
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))
    experiment_name = os.getenv("MLFLOW_EXPERIMENT_NAME", "fineval")
    
    if not mlflow.get_experiment_by_name(experiment_name):
        mlflow.create_experiment(
            experiment_name,
            tags={
                "project": "fineval",
                "description": "Agentic personal finance assistant eval framework"
            }
        )
    mlflow.set_experiment(experiment_name)
```

---

## Section 11 Checklist

- [ ] MLflow starts with `docker compose up`
- [ ] `mlflow` database created in PostgreSQL
- [ ] `https://mlflow.domain.com` accessible in browser (basic auth prompt appears)
- [ ] Login with credentials from Step 1.7 — MLflow UI loads
- [ ] Test run logged successfully via tracker.py
- [ ] Experiment "fineval" visible in MLflow UI
- [ ] Commit: `git commit -m "feat: MLflow VPS setup + tracker + CI gate"`

---

---

# Section 12 — GitHub Actions: Deploy + Eval Pipelines
**Goal:** Automated deploy on push + eval pipeline with GitHub Pages publishing

---

## Step 12.1 — GitHub Secrets to configure

Go to GitHub repo → Settings → Secrets and variables → Actions:

| Secret name | Value |
|---|---|
| `VPS_HOST` | Your VPS IP |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contents of `~/.ssh/id_ed25519_deploy` (private key) |
| `OPENAI_API_KEY` | Your OpenAI key |
| `MLFLOW_TRACKING_URI` | `https://mlflow.domain.com` |
| `MLFLOW_USER` | mlflow |
| `MLFLOW_PASSWORD` | your MLflow basic auth password |
| `BACKEND_URL` | `https://app.domain.com` |
| `DB_USER` | fineval |
| `DB_PASSWORD` | your db password |

---

## Step 12.2 — .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deploy/fineval
            git pull origin main
            docker compose pull
            docker compose up --build -d
            docker compose ps
            echo "Deploy complete: $(date)"
      
      - name: Wait for services to be healthy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            sleep 15
            curl -f https://app.${{ secrets.DOMAIN }}/api/health || exit 1
            echo "Health check passed"
```

---

## Step 12.3 — .github/workflows/eval.yml

```yaml
name: Eval Pipeline

on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]
  workflow_dispatch:           # manual trigger from test.domain.com

jobs:
  run-evals:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install Python dependencies
        run: |
          pip install -r evals/requirements.txt
      
      - name: Set up Node.js (for Lighthouse)
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli lighthouse

      - name: Install Playwright
        run: |
          pip install pytest-playwright
          playwright install chromium --with-deps
      
      # --- Run all 5 tests ---
      
      - name: Run DeepEval tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
        run: |
          cd evals
          deepeval test run deepeval_tests/ \
            --json-report \
            --json-report-file=reports/deepeval_results.json \
            -v || true      # don't fail pipeline on test failures — gate does that
      
      - name: Run Playwright E2E tests
        env:
          BASE_URL: ${{ secrets.BACKEND_URL }}
        run: |
          cd evals
          pytest playwright_tests/ \
            --html=reports/playwright/index.html \
            --self-contained-html \
            --json-report \
            --json-report-file=reports/playwright_results.json \
            -v || true
      
      - name: Run Locust load test
        env:
          TARGET_HOST: ${{ secrets.BACKEND_URL }}
        run: |
          locust -f evals/performance/locustfile.py \
            --host=${{ secrets.BACKEND_URL }} \
            --users=50 --spawn-rate=5 \
            --run-time=120s --headless \
            --html=evals/reports/locust/index.html \
            --csv=evals/reports/locust/results || true
          
          python evals/scripts/parse_locust.py
      
      - name: Run Lighthouse
        run: |
          python evals/performance/lighthouse_runner.py || true
      
      # --- Log to MLflow ---
      
      - name: Log results to MLflow
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_USER }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_PASSWORD }}
        run: |
          python evals/scripts/log_to_mlflow.py
      
      # --- CI Gate ---
      
      - name: Run CI gate
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_USER }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_PASSWORD }}
        run: python evals/mlflow_logger/ci_gate.py
      
      # --- Build master dashboard ---
      
      - name: Build GitHub Pages dashboard
        run: python evals/scripts/build_dashboard.py
      
      # --- Publish to GitHub Pages ---
      
      - name: Publish to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./evals/reports
          keep_files: true
          commit_message: "ci: eval report ${{ github.run_number }}"
```

---

## Step 12.4 — evals/scripts/build_dashboard.py

```python
import json, os
from datetime import datetime

def load_json(path, default={}):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default

def build_dashboard():
    base = "evals/reports"
    
    deepeval = load_json(f"{base}/deepeval_results.json")
    playwright = load_json(f"{base}/playwright_results.json")
    locust = load_json(f"{base}/locust/summary.json")
    lighthouse = load_json(f"{base}/lighthouse/summary.json")
    
    # Parse scores
    de_passed = deepeval.get("summary", {}).get("passed", 0)
    de_failed = deepeval.get("summary", {}).get("failed", 0)
    de_total = de_passed + de_failed
    
    pw_passed = playwright.get("summary", {}).get("passed", 0)
    pw_total = playwright.get("summary", {}).get("total", 0)
    
    lh_perf = list(lighthouse.values())[0].get("performance", 0) if lighthouse else 0
    
    lc_p95 = locust.get("p95_ms", 0)
    
    ci_status = "PASSED" if de_failed == 0 and pw_passed == pw_total else "FAILED"
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FinEval — Eval Reports</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #333; }}
  h1 {{ font-size: 24px; font-weight: 600; }}
  .meta {{ color: #666; font-size: 14px; margin-bottom: 24px; }}
  .gate {{ display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;
           background: {"#dcfce7; color: #166534" if ci_status == "PASSED" else "#fee2e2; color: #991b1b"}; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 24px 0; }}
  .card {{ border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }}
  .card .label {{ font-size: 13px; color: #6b7280; margin-bottom: 4px; }}
  .card .value {{ font-size: 28px; font-weight: 700; }}
  .card .status {{ font-size: 12px; margin-top: 4px; }}
  .pass {{ color: #16a34a; }} .fail {{ color: #dc2626; }}
  .reports {{ margin-top: 32px; }}
  .reports h2 {{ font-size: 18px; font-weight: 600; margin-bottom: 12px; }}
  .reports a {{ display: block; color: #2563eb; text-decoration: none; padding: 8px 0;
                border-bottom: 1px solid #f3f4f6; }}
  .reports a:hover {{ text-decoration: underline; }}
  .history {{ margin-top: 32px; font-size: 13px; color: #6b7280; }}
</style>
</head>
<body>
<h1>FinEval — Eval Reports</h1>
<div class="meta">
  Run #{os.getenv("GITHUB_RUN_NUMBER", "local")} · {datetime.now().strftime("%B %d %Y, %H:%M UTC")}
  <span class="gate" style="margin-left: 12px;">CI Gate: {ci_status}</span>
</div>

<div class="grid">
  <div class="card">
    <div class="label">DeepEval tests</div>
    <div class="value {"pass" if de_failed == 0 else "fail"}">{de_passed}/{de_total}</div>
    <div class="status {"pass" if de_failed == 0 else "fail"}">{"All passed" if de_failed == 0 else f"{de_failed} failed"}</div>
  </div>
  <div class="card">
    <div class="label">Playwright E2E</div>
    <div class="value {"pass" if pw_passed == pw_total else "fail"}">{pw_passed}/{pw_total}</div>
    <div class="status {"pass" if pw_passed == pw_total else "fail"}">{"All passed" if pw_passed == pw_total else "Some failed"}</div>
  </div>
  <div class="card">
    <div class="label">Locust p95</div>
    <div class="value {"pass" if lc_p95 < 5000 else "fail"}">{lc_p95}ms</div>
    <div class="status {"pass" if lc_p95 < 5000 else "fail"}">{"Within threshold" if lc_p95 < 5000 else "Exceeds 5s"}</div>
  </div>
  <div class="card">
    <div class="label">Lighthouse perf</div>
    <div class="value {"pass" if lh_perf >= 70 else "fail"}">{lh_perf}</div>
    <div class="status {"pass" if lh_perf >= 70 else "fail"}">{"Above 70" if lh_perf >= 70 else "Below threshold"}</div>
  </div>
</div>

<div class="reports">
  <h2>Full reports</h2>
  <a href="playwright/index.html">→ Playwright HTML report</a>
  <a href="locust/index.html">→ Locust load test report</a>
  <a href="lighthouse/index.html">→ Lighthouse report</a>
  <a href="https://mlflow.domain.com">→ MLflow experiment tracking ↗</a>
</div>

<div class="history">
  Report history available in the <a href="https://github.com/anuragkandulna/fin-eval/actions">GitHub Actions runs</a>.
</div>
</body>
</html>"""
    
    with open(f"{base}/index.html", "w") as f:
        f.write(html)
    
    print(f"Dashboard built → {base}/index.html")

if __name__ == "__main__":
    build_dashboard()
```

---

## Section 12 Checklist

- [ ] All GitHub Secrets configured (10 secrets)
- [ ] `deploy.yml` created — push to main triggers deploy
- [ ] `eval.yml` created — triggers after deploy + manual dispatch
- [ ] `build_dashboard.py` generates `index.html`
- [ ] GitHub Pages enabled: repo Settings → Pages → Branch: `gh-pages`
- [ ] First full pipeline run: push a small change to main
- [ ] Check Actions tab — deploy + eval workflows both visible
- [ ] Check `https://anuragkandulna.github.io/fin-eval` — dashboard loads
- [ ] Commit: `git commit -m "ci: GitHub Actions deploy + eval pipeline + GitHub Pages"`

---

---

# Section 13 — Test Dashboard (test.domain.com)
**Goal:** Live status page with manual trigger button

---

## Step 13.1 — test-dashboard/src/App.tsx

```tsx
import { useState, useEffect } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN
const PAGES_URL = import.meta.env.VITE_PAGES_URL || 
  "https://anuragkandulna.github.io/fin-eval"

interface Scores {
  deepeval: { faithfulness: number; hallucination_rate: number; tool_accuracy: number }
  playwright: { passed: number; total: number }
  last_updated: string
}

interface PerfScores {
  locust: { p95_ms: number; error_rate: number; rps: number }
  lighthouse: { performance: number; accessibility: number }
}

export default function App() {
  const [scores, setScores] = useState<Scores | null>(null)
  const [perf, setPerf] = useState<PerfScores | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState('')

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const [evalRes, perfRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/scores/eval`),
          axios.get(`${BACKEND_URL}/scores/performance`)
        ])
        setScores(evalRes.data)
        setPerf(perfRes.data)
      } catch (e) {
        console.error("Failed to fetch scores", e)
      }
    }
    fetchScores()
    const interval = setInterval(fetchScores, 30000)
    return () => clearInterval(interval)
  }, [])

  const triggerEvals = async () => {
    setTriggering(true)
    setTriggerMsg('')
    try {
      await axios.post(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/eval.yml/dispatches`,
        { ref: "main" },
        { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
      )
      setTriggerMsg("✅ Eval pipeline triggered! Results will update in ~5 minutes.")
    } catch {
      setTriggerMsg("❌ Failed to trigger. Check GitHub token permissions.")
    } finally {
      setTriggering(false)
    }
  }

  const pass = (v: number, min: number) => v >= min
  const passMax = (v: number, max: number) => v <= max

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>FinEval — Test Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            {scores ? `Last updated: ${new Date(scores.last_updated).toLocaleString()}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={triggerEvals}
          disabled={triggering}
          style={{
            background: triggering ? '#9ca3af' : '#2563eb',
            color: 'white', border: 'none', borderRadius: 8,
            padding: '10px 20px', cursor: triggering ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600
          }}
        >
          {triggering ? 'Triggering...' : '▶ Run All Tests'}
        </button>
      </div>
      
      {triggerMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#f0fdf4', 
                      border: '1px solid #bbf7d0', marginBottom: 16, fontSize: 14 }}>
          {triggerMsg}
        </div>
      )}

      {/* Eval scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Faithfulness', value: scores?.deepeval.faithfulness, min: 0.70, fmt: (v:number) => v.toFixed(2) },
          { label: 'Hallucination', value: scores?.deepeval.hallucination_rate, max: 0.30, fmt: (v:number) => v.toFixed(2) },
          { label: 'Tool accuracy', value: scores?.deepeval.tool_accuracy, min: 0.90, fmt: (v:number) => v.toFixed(2) },
        ].map(({ label, value, min, max, fmt }) => {
          const ok = value === undefined ? null : (min ? pass(value, min) : passMax(value, max!))
          return (
            <div key={label} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: ok === null ? '#9ca3af' : ok ? '#16a34a' : '#dc2626' }}>
                {value !== undefined ? fmt(value) : '—'}
              </div>
              <div style={{ fontSize: 12, color: ok ? '#16a34a' : '#dc2626' }}>
                {ok === null ? '' : ok ? '✅ Pass' : '❌ Fail'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Playwright + Perf */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Playwright E2E</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {scores ? `${scores.playwright.passed}/${scores.playwright.total}` : '—'}
          </div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Locust p95</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: (perf?.locust.p95_ms ?? 0) < 5000 ? '#16a34a' : '#dc2626' }}>
            {perf ? `${perf.locust.p95_ms}ms` : '—'}
          </div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Lighthouse perf</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: (perf?.lighthouse.performance ?? 0) >= 70 ? '#16a34a' : '#dc2626' }}>
            {perf ? perf.lighthouse.performance : '—'}
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Reports</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Full eval reports', href: PAGES_URL },
            { label: 'MLflow dashboard', href: 'https://mlflow.domain.com' },
            { label: 'GitHub Actions', href: `https://github.com/${GITHUB_REPO}/actions` },
            { label: 'Source code', href: `https://github.com/${GITHUB_REPO}` },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
               style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none' }}>
              → {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## Section 13 Checklist

- [ ] `test-dashboard/` built and running on port 3001
- [ ] Scores load from backend `/scores/eval` and `/scores/performance`
- [ ] Trigger button fires `workflow_dispatch` via GitHub API
- [ ] All report links correct (GitHub Pages, MLflow, Actions)
- [ ] `test.domain.com` shows dashboard in browser
- [ ] Commit: `git commit -m "feat: test dashboard with live scores + trigger button"`

---

---

# Section 14 — Docs + Findings
**Goal:** Three documents that make your project interview-ready

---

## Step 14.1 — docs/eval_decisions.md

Write answers to these questions in your own words:

```markdown
# Eval Design Decisions

## Why 0.70 faithfulness threshold?
[Write: How you calibrated it — ran 20 cases manually, checked where quality degraded]

## Why 0.30 hallucination threshold?
[Write: What hallucination rate you observed initially, how you reduced it]

## Why chunk size 512?
[Write: What happened at 1024 — faithfulness dropped. Show the MLflow chart.]

## How do you handle non-determinism?
[Write: Run each critical test 3 times, take median, flag variance > 0.15]

## Why GPT-3.5-turbo as eval judge?
[Write: Cost vs quality tradeoff — suitable for development, would use GPT-4o-mini in production]

## Why separate deploy and eval workflows?
[Write: Deploy should be fast — eval runs after, doesn't block the deploy itself]

## What does the CI gate protect against?
[Write: Prompt regression — if a prompt change drops faithfulness below 0.70, deployment of new prompts is blocked]
```

---

## Step 14.2 — docs/findings.md

This is the most important document. Write it after running your first real eval suite:

```markdown
# Findings

## Finding 1: Chunk size affects faithfulness
When I set chunk_size=1024, faithfulness score dropped to 0.58.
At 512 tokens, it recovered to 0.82.
MLflow experiment run XXX shows this comparison.

## Finding 2: Hallucination traps worked as designed
The 6 hallucination trap questions (asking for specific bank rates,
future predictions) correctly returned "I don't have that information"
in 5/6 cases. One case fabricated a rate — fixed by adding explicit
guardrail instruction in the prompt.

## Finding 3: Tool call ordering failed on ambiguous queries
2 out of 30 test cases sent ambiguous queries where the agent called
rate_fetcher before eligibility_checker. Fixed by adding explicit
routing condition in the LangGraph graph.

## Finding 4: Playwright caught a real UI bug
The loading indicator test failed because the data-testid attribute
was missing from the loading component. This would not have been
caught by unit tests.

## Finding 5: Locust revealed p95 spike at t=45s
Under 50 concurrent users, p95 latency spiked to 8.2s at t=45s.
Root cause: ChromaDB similarity search blocking the async event loop.
Fix: moved ChromaDB calls to a thread pool executor.
```

---

## Step 14.3 — Final README update

Update README to add:
- Live URLs (all 4)
- Badge links for GitHub Actions status
- "Key findings" section with 2-3 bullet points
- Clear explanation of the eval framework in the first 3 paragraphs

---

## Section 14 Checklist

- [ ] `eval_decisions.md` — all 7 questions answered in your own words
- [ ] `findings.md` — at least 3 real findings from running the suite
- [ ] README updated with all live URLs and status badges
- [ ] `architecture.md` updated with final deployment diagram
- [ ] Final commit: `git commit -m "docs: eval decisions, findings, updated README"`
- [ ] Push and verify all 4 URLs are live and working

---

---

# Final Interview Checklist

Before applying to jobs, verify all of these:

**Live URLs**
- [ ] `https://app.domain.com` — app loads, chat works, finance form works
- [ ] `https://test.domain.com` — scores load, trigger button works
- [ ] `https://mlflow.domain.com` — login works, experiments visible
- [ ] `https://anuragkandulna.github.io/fin-eval` — dashboard with report links

**GitHub repo**
- [ ] Public repo with clean commit history
- [ ] README leads with eval framework, not the app
- [ ] Actions tab shows green deploy + eval runs
- [ ] `docs/findings.md` has real findings

**What to say in interviews**
> "I built a personal finance assistant in LangGraph with RAG and tool orchestration.
> The real project is the eval framework around it — DeepEval for LLM quality,
> Playwright for E2E flows, Locust for load, Lighthouse for frontend.
> All five run in CI on every push, results publish to GitHub Pages automatically,
> and deployment is blocked if any threshold fails.
> The live dashboard is at test.domain.com — here, let me show you."
