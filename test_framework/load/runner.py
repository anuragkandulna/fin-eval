"""
Async load test runner.
Fires N concurrent users for D seconds per endpoint.
Records every request to CSV with timestamp, duration, status.
Computes p50/p75/p90/p95/p99 from the CSV and generates HTML report.
"""

import argparse
import asyncio
import aiohttp
import csv
import os
import statistics
import tempfile
import time
from datetime import datetime
from pathlib import Path

from config import ENDPOINTS, CSV_OUTPUT, REPORT_OUTPUT, API_URL, P95_THRESHOLD


def compute_percentiles(durations_ms: list[float]) -> dict:
    if not durations_ms:
        return {}
    s = sorted(durations_ms)
    n = len(s)

    def pct(p):
        return round(s[max(0, int(n * p / 100) - 1)], 2)

    return {
        "count": n,
        "min":   round(min(s), 2),
        "max":   round(max(s), 2),
        "avg":   round(statistics.mean(s), 2),
        "p50":   pct(50),
        "p75":   pct(75),
        "p90":   pct(90),
        "p95":   pct(95),
        "p99":   pct(99),
    }


async def _request(
    session: aiohttp.ClientSession,
    endpoint_name: str,
    config: dict,
    writer,
    lock: asyncio.Lock,
):
    url    = f"{API_URL}{config['path']}"
    method = config["method"]
    body   = config.get("body")
    start  = time.perf_counter()
    status = 0
    error  = ""

    try:
        if method == "GET":
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as r:
                status = r.status
                await r.text()
        else:
            async with session.post(url, json=body,
                                    timeout=aiohttp.ClientTimeout(total=60)) as r:
                status = r.status
                await r.text()
    except Exception as e:
        error = str(e)[:100]

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    async with lock:
        writer.writerow({
            "endpoint":    endpoint_name,
            "timestamp":   datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "status":      status,
            "error":       error,
            "success":     1 if 200 <= status < 300 else 0,
        })


async def _load_endpoint(
    endpoint_name: str,
    config: dict,
    users: int,
    duration_sec: int,
    writer,
    lock: asyncio.Lock,
):
    connector = aiohttp.TCPConnector(limit=users + 10)
    async with aiohttp.ClientSession(connector=connector) as session:
        end_time = time.time() + duration_sec
        while time.time() < end_time:
            await asyncio.gather(*[
                asyncio.create_task(_request(session, endpoint_name, config, writer, lock))
                for _ in range(users)
            ], return_exceptions=True)
            await asyncio.sleep(0.1)


async def _upload_request(
    session: aiohttp.ClientSession,
    file_path: str,
    writer,
    lock: asyncio.Lock,
):
    url   = f"{API_URL}/documents/upload"
    start = time.perf_counter()
    status = 0
    error  = ""
    try:
        with open(file_path, "rb") as f:
            data = aiohttp.FormData()
            data.add_field("file", f, filename="load_test.txt",
                           content_type="text/plain")
            async with session.post(url, data=data,
                                    timeout=aiohttp.ClientTimeout(total=60)) as r:
                status = r.status
                await r.text()
    except Exception as e:
        error = str(e)[:100]

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    async with lock:
        writer.writerow({
            "endpoint": "upload",
            "timestamp": datetime.utcnow().isoformat(),
            "duration_ms": duration_ms,
            "status": status,
            "error": error,
            "success": 1 if 200 <= status < 300 else 0,
        })


async def run_load_tests(users: int, duration_sec: int) -> str:
    Path("data").mkdir(parents=True, exist_ok=True)
    fieldnames = ["endpoint", "timestamp", "duration_ms", "status", "error", "success"]
    lock = asyncio.Lock()

    with open(CSV_OUTPUT, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for name, config in ENDPOINTS.items():
            print(f"  {name}: {users} users × {duration_sec}s")
            await _load_endpoint(name, config, users, duration_sec, writer, lock)

    print(f"Results → {CSV_OUTPUT}")
    return CSV_OUTPUT


async def run_upload_load(users: int, duration_sec: int) -> str:
    Path("data").mkdir(parents=True, exist_ok=True)
    upload_csv = "data/upload_results.csv"
    fieldnames = ["endpoint", "timestamp", "duration_ms", "status", "error", "success"]
    lock = asyncio.Lock()

    # Create a small test file once
    tmp = tempfile.NamedTemporaryFile(suffix=".txt", delete=False)
    tmp.write(b"Emergency fund: Save 3-6 months of expenses in a liquid account.\n" * 10)
    tmp.close()

    try:
        with open(upload_csv, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            connector = aiohttp.TCPConnector(limit=users + 5)
            async with aiohttp.ClientSession(connector=connector) as session:
                end_time = time.time() + duration_sec
                while time.time() < end_time:
                    await asyncio.gather(*[
                        asyncio.create_task(
                            _upload_request(session, tmp.name, writer, lock)
                        )
                        for _ in range(users)
                    ], return_exceptions=True)
                    await asyncio.sleep(0.2)
    finally:
        os.unlink(tmp.name)

    return upload_csv


def parse_csv_stats(csv_path: str) -> dict[str, dict]:
    import csv as csv_module
    results: dict[str, list[float]] = {}
    errors: dict[str, int] = {}

    with open(csv_path) as f:
        for row in csv_module.DictReader(f):
            ep = row["endpoint"]
            results.setdefault(ep, [])
            errors.setdefault(ep, 0)
            results[ep].append(float(row["duration_ms"]))
            if row["success"] == "0":
                errors[ep] += 1

    stats = {}
    for ep, durations in results.items():
        s = compute_percentiles(durations)
        s["errors"]     = errors.get(ep, 0)
        s["error_rate"] = round(errors.get(ep, 0) / len(durations) * 100, 1) if durations else 0
        stats[ep] = s
    return stats


if __name__ == "__main__":
    from config import LOAD_USERS, LOAD_DURATION

    parser = argparse.ArgumentParser(description="Run FinEval API load tests.")
    parser.add_argument("users", nargs="?", type=int, default=LOAD_USERS)
    parser.add_argument("duration", nargs="?", type=int, default=LOAD_DURATION)
    parser.add_argument("--users", dest="users_override", type=int, help="Concurrent users override.")
    parser.add_argument("--duration", dest="duration_override", type=int, help="Duration override in seconds.")
    args = parser.parse_args()

    users = args.users_override if args.users_override is not None else args.users
    duration = args.duration_override if args.duration_override is not None else args.duration
    print(f"Load test: {users} users × {duration}s")
    asyncio.run(run_load_tests(users, duration))
