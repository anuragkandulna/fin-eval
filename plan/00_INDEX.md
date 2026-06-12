# MortgageEval — Full Build Guide
**Project:** Agentic AI Mortgage Assistant + Eval Framework  
**Target role:** Senior AI QA Engineer · 25-30 LPA  
**Author:** Anurag Kandulna

---

## How to use this guide

Each section is a self-contained prompt. Work through them in order.
Complete one section fully before moving to the next.
Each section ends with a checklist — don't proceed until all items are checked.

---

## Sections

| # | Section | What you build | Est. time |
|---|---------|----------------|-----------|
| 01 | Infrastructure setup | VPS + domain + DNS + Docker + Nginx | 2-3 hrs |
| 02 | Monorepo scaffold | Folder structure + Docker Compose + env files | 1-2 hrs |
| 03 | Backend — FastAPI | All endpoints + Pydantic schemas + DB setup | 3-4 hrs |
| 04 | Backend — LangGraph agent | State machine + nodes + tools + prompts | 4-5 hrs |
| 05 | Backend — RAG pipeline | Qdrant + ingest + retriever | 2-3 hrs |
| 06 | Frontend — React app | Chat UI + Loan form + Doc upload | 3-4 hrs |
| 07 | Synthetic data | PII-safe test case generator (30 cases) | 1-2 hrs |
| 08 | Eval — DeepEval | RAG + hallucination + tool call + reasoning tests | 3-4 hrs |
| 09 | Eval — Playwright | E2E test scenarios (chat + loan + upload) | 2-3 hrs |
| 10 | Eval — Locust + Lighthouse | Load tests + frontend quality scores | 1-2 hrs |
| 11 | MLflow setup | VPS tracking server + logger + CI gate | 2-3 hrs |
| 12 | GitHub Actions | deploy.yml + eval.yml + gh-pages publish | 2-3 hrs |
| 13 | Test dashboard | test.domain.com + trigger button | 2-3 hrs |
| 14 | Docs + findings | architecture.md + eval_decisions.md + findings.md | 2-3 hrs |

**Total estimated time:** 3-4 weekends

---

## Final URLs after completion

| URL | What |
|-----|------|
| app.domain.com | Live mortgage assistant app |
| test.domain.com | Test dashboard + manual trigger |
| mlflow.domain.com | MLflow experiment tracking (score trends across prompt versions) |
| trace.domain.com | Langfuse agent traces (per-request node/LLM/latency breakdown) |
| yourusername.github.io/mortgageeval | Permanent eval reports (GitHub Pages) |

---

## Tech stack summary

```
Frontend:    React 18 + TypeScript + Vite + TailwindCSS + Axios
Backend:     FastAPI + Python 3.12 + Pydantic v2 + SQLAlchemy
Agent:       LangGraph + LangChain + OpenAI GPT-3.5-turbo
RAG:         Qdrant + LangChain text splitter + OpenAI embeddings
Tracing:     Langfuse (self-hosted, per-request agent traces)
Database:    PostgreSQL + Redis
Eval:        DeepEval + MLflow + Playwright + Locust + Lighthouse CI
Infra:       Docker + Docker Compose + Nginx + Certbot (SSL)
CI/CD:       GitHub Actions + GitHub Pages
VPS:         Hetzner CX22 (~₹340/mo)
Domain:      Namecheap .com (~₹700/yr)
```
