---
name: fineval-migrations
description: "Schema change discipline for FinEval's Neon PostgreSQL database. Use whenever adding, removing, or altering a model. There are no ORM models yet — this activates as ChatSession and future models are introduced (Sprint 1.5+). Consult before writing a model change."
---

# FinEval Migrations

## Current state — read before assuming Alembic

FinEval has **no ORM models yet and no migration files**. Schema is created via
`Base.metadata.create_all` in `init_db()` at startup — additive only, it does not alter or
drop existing tables. This skill governs discipline while that remains true.

## Model-first discipline

- Define the model before writing any endpoint that uses it.
- `create_all` is safe for **new** tables. It will **not** add a column to an existing table,
  drop a column, or change a type. If a model changes after deployment, `create_all` silently
  does nothing about the mismatch — that mismatch is the signal real migrations are needed.

## When Alembic becomes necessary

The moment any model changes after data exists in a deployed table (renaming, dropping, or
retyping a column), `create_all` can't handle it safely. That is the trigger to introduce
Alembic — not before, since adding it now would be unrequested complexity (Simplicity First).

When that trigger happens: model change → autogenerate → review the generated file for
unintended drops (a renamed column looks like a drop + an add) → apply. Take a Neon
backup/branch snapshot first — see `fineval-destructive-operations`.

## Soft-delete convention

Decide the soft-delete flag name when the first delete-capable model (e.g. a stored document
reference) is actually designed. Don't assume `is_active` — read whatever convention gets
established at that point and stay consistent with it.

## Before finishing

- [ ] Is this still `create_all`-only, or does a real migration tool now exist? (If the
      latter, this skill needs a real rewrite, not a patch.)
- [ ] New model defined before the endpoint that uses it?
- [ ] If altering an existing deployed table: is `create_all` actually sufficient, or is this
      the trigger point for Alembic?
