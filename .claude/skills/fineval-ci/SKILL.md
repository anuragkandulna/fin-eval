---
name: fineval-ci
description: "GitHub Actions and CI/CD discipline for FinEval. Use when creating or changing a workflow under .github/workflows/, adding a CI step, pinning action versions, or touching ci_gate.py's integration into test-suite.yml. Also use when deciding whether a CI step should block the pipeline. Consult before writing the workflow."
---

# FinEval CI

## The boundary

CI builds and tests. `build-and-deploy.yml` also pushes to GHCR and SSHes to deploy — that's
FinEval's one deliberate exception to "CI never touches production," because the deploy IS
the GitHub Actions pipeline by design (§3.6/3.7 of CONTEXT.md). Treat `HOSTINGER_SSH_KEY` and
other deploy secrets as the single most sensitive thing in GitHub Secrets precisely because
of this exception.

## Test suite steps never block the pipeline — except one

- Load, eval, functional, and performance suites all run with `continue-on-error: true`
  (or `|| true`). Individual test failures surface in reports but don't fail the job.
- `ci_gate.py` is the **only** hard gate. It reads the latest MLflow run for the current
  experiment, compares against `GATE_*` env-var thresholds, and is the only step that calls
  `sys.exit(1)`.
- Never remove `continue-on-error` from a test runner step to "make it strict" — that
  duplicates what `ci_gate.py` already does and creates two conflicting gate mechanisms.

## Pinning

- Always pin action versions: `actions/checkout@v4`, never `@latest`.
- `@latest` means a green pipeline can turn red without any code change, and a compromised
  action runs with repository access.

## Thresholds

Every `GATE_*` threshold in `ci_gate.py` must be `os.getenv(..., "default")`, never a bare
literal in the comparison logic.

## Report publishing

`test-suite.yml` collects all 4 suites' HTML reports and publishes to the `test-reports`
branch via GitHub Pages. A new test suite or report type must be added to that collection
step, not just produce a report nobody links.

## Before finishing

- [ ] New/changed action calls use a pinned version, never `@latest`?
- [ ] New test suite steps use `continue-on-error: true`?
- [ ] Any new threshold in `ci_gate.py` is env-var overridable?
- [ ] `ci_gate.py` remains the only `sys.exit(1)` in the pipeline?
- [ ] New reports wired into the GitHub Pages publish step?
