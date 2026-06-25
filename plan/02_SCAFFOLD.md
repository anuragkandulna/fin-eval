# Section 02 — Monorepo Scaffold
**Goal:** Full repo structure created + Docker Compose wiring all services + env files

---

## Step 2.1 — Create repo on GitHub

1. Go to github.com → New repository
2. Name: `fineval`
3. Visibility: **Public** (required for GitHub Pages)
4. Initialize with README: yes
5. Clone locally:

```bash
git clone https://github.com/anuragkandulna/fin-eval.git
cd fineval
```

---

## Step 2.2 — Create full folder structure

Run this script to create all folders and placeholder files at once:

```bash
#!/bin/bash
# Run from repo root

# Frontend
mkdir -p frontend/src/{components,api,pages,hooks}
touch frontend/src/components/{ChatWindow,LoanForm,DocumentUpload,ResultsPanel,NavBar}.tsx
touch frontend/src/api/client.ts
touch frontend/src/pages/{Chat,Loan,NotFound}.tsx
touch frontend/src/App.tsx
touch frontend/src/main.tsx
touch frontend/{package.json,vite.config.ts,tsconfig.json,index.html,.env.local}
touch frontend/Dockerfile

# Backend
mkdir -p backend/app/{routers,agent,rag,models}
touch backend/app/routers/{chat,recommend,documents,synthetic,scores}.py
touch backend/app/agent/{graph,nodes,tools,prompts,state}.py
touch backend/app/rag/{ingest,retriever}.py
touch backend/app/models/{schemas,database}.py
touch backend/app/{main,config}.py
touch backend/{requirements.txt,Dockerfile,.env}

# Test dashboard
mkdir -p test-dashboard/src/{components,api}
touch test-dashboard/src/components/{ScoreCard,TestResults,TriggerButton,HistoryTable}.tsx
touch test-dashboard/src/App.tsx
touch test-dashboard/{package.json,vite.config.ts,Dockerfile}

# Evals
mkdir -p evals/{deepeval_tests,playwright_tests,performance,mlflow_logger,synthetic_data,scripts,reports}
touch evals/deepeval_tests/{test_rag_quality,test_hallucination,test_tool_calls,test_reasoning,test_synthetic}.py
touch evals/playwright_tests/{test_chat_flow,test_loan_form,test_document_upload}.py
touch evals/performance/{locustfile,lighthouse_runner}.py
touch evals/mlflow_logger/{tracker,ci_gate}.py
touch evals/synthetic_data/{generator,pii_obfuscator}.py
touch evals/scripts/build_dashboard.py
touch evals/{conftest.py,requirements.txt}

# MLflow server
mkdir -p mlflow_server
touch mlflow_server/{docker-compose.yml,nginx_mlflow.conf}

# GitHub Actions
mkdir -p .github/workflows
touch .github/workflows/{deploy.yml,eval.yml}

# Docs
mkdir -p docs
touch docs/{architecture.md,eval_decisions.md,findings.md}

# Root files
touch docker-compose.yml docker-compose.local.yml .env.example .gitignore README.md

echo "Scaffold complete"
```

---

## Step 2.3 — .gitignore

```gitignore
# Environment files
.env
.env.local
.env.production
**/.env

# Python
__pycache__/
*.pyc
*.pyo
.pytest_cache/
.deepeval/

# Node
node_modules/
dist/
.vite/

# Reports (generated, not committed)
evals/reports/

# MLflow local artifacts
mlruns/
mlflow_artifacts/

# Docker
*.log

# IDE
.vscode/
.idea/
```

---

## Step 2.4 — Root docker-compose.yml

This is the single command that runs everything locally and on VPS:

```yaml
version: '3.8'

services:

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fineval
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql   # creates mlflow + langfuse DBs
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_started
    volumes:
      - ./evals/reports:/app/reports
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  test-dashboard:
    build: ./test-dashboard
    ports:
      - "3001:80"
    environment:
      - VITE_GITHUB_REPO=${GITHUB_REPO}
      - VITE_GITHUB_TOKEN=${GITHUB_TOKEN}
      - VITE_BACKEND_URL=https://app.${DOMAIN}/api
    restart: unless-stopped

  mlflow:
    image: python:3.11-slim
    command: >
      bash -c "pip install mlflow psycopg2-binary -q &&
               mlflow server
               --backend-store-uri postgresql://${DB_USER}:${DB_PASSWORD}@postgres/mlflow
               --default-artifact-root /mlflow/artifacts
               --host 0.0.0.0
               --port 5000"
    ports:
      - "5000:5000"
    volumes:
      - mlflow_artifacts:/mlflow/artifacts
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  langfuse:
    image: langfuse/langfuse:latest
    ports:
      - "3002:3000"
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/langfuse
      - NEXTAUTH_URL=https://trace.${DOMAIN}
      - NEXTAUTH_SECRET=${LANGFUSE_SECRET}
      - SALT=${LANGFUSE_SALT}
      - TELEMETRY_ENABLED=false
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pg_data:
  qdrant_data:
  mlflow_artifacts:
```

---

## Step 2.4a — init-db.sql (repo root)

PostgreSQL needs separate databases for MLflow and Langfuse. This file runs automatically on first `docker compose up` via the volume mount above:

```sql
CREATE DATABASE mlflow;
CREATE DATABASE langfuse;
```

---

## Step 2.5 — .env.example (commit this, not .env)

```env
# App
DOMAIN=yourdomain.com
ENVIRONMENT=production

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DB_USER=fineval
DB_PASSWORD=your_strong_password_here
DATABASE_URL=postgresql://fineval:your_strong_password_here@postgres/fineval

# Redis
REDIS_URL=redis://redis:6379

# MLflow
MLFLOW_TRACKING_URI=http://mlflow:5000
MLFLOW_EXPERIMENT_NAME=fineval

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=finance_docs

# Langfuse
LANGFUSE_SECRET=generate_a_random_32_char_string   # openssl rand -hex 32
LANGFUSE_SALT=generate_another_random_32_char_string
LANGFUSE_PUBLIC_KEY=pk-lf-...      # generated after first Langfuse login
LANGFUSE_SECRET_KEY=sk-lf-...      # generated after first Langfuse login
LANGFUSE_HOST=http://langfuse:3000

# GitHub (for test dashboard trigger)
GITHUB_REPO=anuragkandulna/fin-eval
GITHUB_TOKEN=ghp_...

# Eval thresholds
FAITHFULNESS_THRESHOLD=0.70
HALLUCINATION_THRESHOLD=0.30
TOOL_ACCURACY_THRESHOLD=0.90
RELEVANCY_THRESHOLD=0.75
PLAYWRIGHT_PASS_RATE=0.90
LOCUST_P95_MS=3000
LIGHTHOUSE_PERF_MIN=70
```

---

## Step 2.6 — docker-compose.local.yml (for local dev override)

```yaml
version: '3.8'

# Overrides for local development
# Usage: docker compose -f docker-compose.yml -f docker-compose.local.yml up

services:
  backend:
    volumes:
      - ./backend:/app     # hot reload
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    environment:
      - ENVIRONMENT=local
      - MLFLOW_TRACKING_URI=http://mlflow:5000

  frontend:
    volumes:
      - ./frontend/src:/app/src   # hot reload via vite dev server
    command: npm run dev -- --host 0.0.0.0 --port 3000
    ports:
      - "3000:3000"
```

---

## Step 2.7 — README.md skeleton

```markdown
# FinEval

An agentic AI personal finance assistant with a production-grade eval framework.

## Live URLs
- **App:** https://app.domain.com
- **Eval Dashboard:** https://test.domain.com
- **MLflow:** https://mlflow.domain.com
- **Eval Reports:** https://anuragkandulna.github.io/fin-eval

## What this project demonstrates
- Agentic AI application (LangGraph + RAG + multi-tool orchestration)
- LLM evaluation framework (DeepEval — faithfulness, hallucination, tool accuracy)
- E2E test automation (Playwright)
- Load testing (Locust — p95 latency under 50 concurrent users)
- Frontend quality gates (Lighthouse CI)
- MLflow experiment tracking with prompt versioning
- CI/CD pipeline with eval gates (blocks deployment on score regression)

## Run locally
\`\`\`bash
cp .env.example .env    # fill in your values
docker compose -f docker-compose.yml -f docker-compose.local.yml up
\`\`\`

## Run evals
\`\`\`bash
cd evals
deepeval test run deepeval_tests/
\`\`\`

## Tech stack
React · FastAPI · LangGraph · Qdrant · DeepEval · MLflow · Langfuse ·
Playwright · Locust · Lighthouse · Docker · GitHub Actions
```

---

## Section 02 Checklist

- [ ] GitHub repo created (public)
- [ ] Full folder structure created via scaffold script
- [ ] `.gitignore` in place
- [ ] `init-db.sql` created at repo root (Step 2.4a)
- [ ] `docker-compose.yml` created (includes Qdrant + Langfuse services)
- [ ] `docker-compose.local.yml` created
- [ ] `.env.example` committed (includes Qdrant + Langfuse vars)
- [ ] `.env` created locally (NOT committed) — generate LANGFUSE_SECRET and LANGFUSE_SALT with `openssl rand -hex 32`
- [ ] `README.md` skeleton written
- [ ] Initial commit pushed: `git add . && git commit -m "scaffold: initial repo structure" && git push`

**Before proceeding:** Run `docker compose config` from repo root.
Should output the merged config without errors.
