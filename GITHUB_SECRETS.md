# GitHub Actions — Required Secrets

Configure these at **Settings → Secrets and variables → Actions** in the `anuragkandulna/fin-eval` repository.

---

## test-suite.yml

Runs on every push to `main` / `fea/**` branches.

| Secret | Where to get it |
|--------|----------------|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `DATABASE_URL` | Azure Portal → SQL Database → Connection strings → copy `mssql://` form: `mssql://fineval_admin:<password>@<server>.database.windows.net:1433/<db>` |
| `QDRANT_URL` | Qdrant Cloud dashboard → Cluster → Endpoint (e.g. `https://xxxx.cloud.qdrant.io`) |
| `QDRANT_API_KEY` | Qdrant Cloud dashboard → Cluster → API Keys |

---

## build-and-deploy.yml

Runs on push to `main` only. Builds the Docker image and deploys to Hostinger VPS.

| Secret | Value |
|--------|-------|
| `HOSTINGER_SSH_HOST` | VPS IP address or hostname |
| `HOSTINGER_SSH_USER` | SSH username (e.g. `root` or `ubuntu`) |
| `HOSTINGER_SSH_KEY` | Private SSH key (PEM format, contents of `~/.ssh/id_rsa`) |
| `HOSTINGER_DEPLOY_PATH` | Absolute path on VPS where `docker-compose.yml` is placed (e.g. `/opt/fineval`) |

> `GITHUB_TOKEN` is provided automatically by GitHub — no configuration needed.

---

## Summary — all secrets at a glance

| Secret | test-suite | build-and-deploy |
|--------|:----------:|:----------------:|
| `OPENAI_API_KEY` | ✅ | — |
| `DATABASE_URL` | ✅ | — |
| `QDRANT_URL` | ✅ | — |
| `QDRANT_API_KEY` | ✅ | — |
| `HOSTINGER_SSH_HOST` | — | ✅ |
| `HOSTINGER_SSH_USER` | — | ✅ |
| `HOSTINGER_SSH_KEY` | — | ✅ |
| `HOSTINGER_DEPLOY_PATH` | — | ✅ |
