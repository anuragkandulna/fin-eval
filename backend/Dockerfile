FROM python:3.12-slim

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
RUN uv sync --frozen --no-dev

COPY backend ./backend

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/backend"

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
