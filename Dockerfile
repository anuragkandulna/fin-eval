## syntax=docker/dockerfile:1.7

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY frontend ./
RUN npm run build


FROM python:3.12-slim AS runtime

WORKDIR /app

# Install Microsoft ODBC Driver 18 for SQL Server (required by aioodbc/pyodbc)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl gnupg2 build-essential unixodbc-dev && \
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
      | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg && \
    curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list \
      -o /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock .python-version ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev

COPY backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist
COPY deploy/start.sh ./deploy/start.sh

RUN chmod +x ./deploy/start.sh

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/backend"
ENV PORT=8000

EXPOSE 8000

CMD ["./deploy/start.sh"]
