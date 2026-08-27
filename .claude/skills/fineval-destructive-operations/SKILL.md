---
name: fineval-destructive-operations
description: "Guards irreversible operations in FinEval — Qdrant collection drops or recreation, Neon PostgreSQL schema/table changes, Redis FLUSHDB/FLUSHALL, Docker volume removal, and any script or CI step that could destroy vector data, session data, or ingested documents. Consult before the command runs, not after."
---

# FinEval Destructive Operations

**Rule: never run a destructive command without stating what it destroys and getting
confirmation.** Not "this may affect the data" — the specific collection, table, keys, or
volume, and whether recovery is possible.

## Qdrant

- `recreate_collection(...)` / `delete_collection(...)` destroys everything in `finance_docs`
  — the 4 baseline docs plus anything a user uploaded. No undo without re-ingesting from
  `backend/data/finance_docs/` and re-uploading user documents.
- User-initiated writes (`add_documents` from `/documents/upload`) **must use `wait=True`**.
  A fire-and-forget write can silently drop a chunk if the process restarts before Qdrant
  confirms it.
- Never call `recreate_collection` from application code paths — only from an explicit,
  confirmed maintenance script.

## Neon PostgreSQL

- No ORM models exist yet — schema is `Base.metadata.create_all` only (additive). Any
  `DROP TABLE` / `DROP DATABASE` destroys `ChatSession` history once Sprint 1.5 ships.
- Neon uses branches. Confirm which branch (`main` vs. a dev branch) a connection string
  points to before running any schema change — it's easy to target the wrong one.

## Redis

- Once wired (Sprint 1.4/1.5), Redis holds the semantic cache and session data.
- `FLUSHDB`/`FLUSHALL` clears active sessions and the cache — not catastrophic (cache
  rebuilds, sessions are convenience) but never run in production without stating so first.
- Use `SCAN` + pattern `DEL` for targeted clearing. Never `KEYS *` — it blocks the server.

## Docker

- `docker compose down -v` on the Hostinger VPS destroys any named volume. Plain
  `docker compose down` is safe — containers stop, volumes survive.

## Before running anything destructive

1. Name what will be destroyed — collection, table, keys, or volume.
2. State whether recovery is possible (re-ingest, backup, none).
3. Say how to recover if this is wrong.
4. Ask.

If any of those four cannot be answered, that is the signal to stop, not proceed carefully.

## Before finishing

- [ ] Named the specific Qdrant collection / Neon table / Redis keys / Docker volume affected?
- [ ] Confirmed `wait=True` on any new Qdrant write path?
- [ ] Confirmed which Neon branch is targeted?
- [ ] Recovery path stated, or explicitly "none — get confirmation first"?
