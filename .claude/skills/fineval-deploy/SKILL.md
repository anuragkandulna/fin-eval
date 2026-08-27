---
name: fineval-deploy
description: "Deployment architecture and operations for FinEval on Hostinger VPS. Use when writing or changing deploy/hostinger/docker-compose.yml, Dockerfile, Nginx configuration, environment variables, health checks, or backup jobs. Also use when planning a release or debugging a container that won't start. Consult before changing anything about how the app runs in production."
---

# FinEval Deploy

## Topology

Single-container production: FastAPI serves both the API and the built React SPA
(`frontend/dist` copied into the Python image). No local Postgres or Redis container in
prod — the database is Neon Cloud, the vector store is Qdrant Cloud. Redis (once wired,
Sprint 1.4) may run as a container or a managed service — decide explicitly, don't default
to "just add a `redis:` service" without checking whether a managed option removes a
volume-backup burden.

```
Internet -> Nginx (TLS) :443 -> fineval-app :8000 (FastAPI + SPA)
                                     |-> Neon PostgreSQL (cloud, asyncpg)
                                     '-> Qdrant Cloud (vector search)
```

## Compose

- `deploy/hostinger/docker-compose.yml` pulls the GHCR image — no local build.
- Only Nginx (or the app container directly, until Nginx is written per Sprint 2.2) has
  published ports. Nothing else needs one — there's no local DB to accidentally expose.

## Secrets

- `.env` exists on the VPS only, `chmod 600`. Never committed, never `COPY`'d into the image,
  never passed as Dockerfile `ARG`/`ENV` (both readable in image layers by anyone who can
  pull it).
- Injected at runtime via `env_file:`.
- CORS domain, Neon connection string, Qdrant API key, Langfuse keys, MLflow tracking URI —
  all env vars, none hardcoded (see `fineval-code-quality`).

## Health checks

- `/healthz` — liveness, no dependencies.
- `/healthz/ready` — readiness, checks Neon (`SELECT 1`) and Qdrant reachability.

Don't let liveness depend on Neon/Qdrant — a brief blip there shouldn't restart-loop the
container. That's exactly what a combined check would cause.

## Releases

- GHCR build -> SSH deploy is the CI pipeline itself (`build-and-deploy.yml`) — see
  `fineval-ci` for the boundary this creates.
- `docker compose down` is safe. `docker compose down -v` destroys any named volume — see
  `fineval-destructive-operations`.

## Before finishing

- [ ] Any new service in compose — does it actually need a published port?
- [ ] Any new secret — env var only, never in Dockerfile or compose literal?
- [ ] Health check distinguishes liveness (no deps) from readiness (checks deps)?
- [ ] Rollback path known (previous GHCR tag) before deploying?
