"""
Load tests for FinEval API.
Run from test_framework/load/:
  python runner.py [users] [duration_sec]
Or via pytest (with asyncio):
  pytest tests/test_api_load.py -v
"""
import asyncio
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import P95_THRESHOLD
from runner import run_load_tests, run_upload_load, parse_csv_stats

try:
    from reports.generate_report import generate_load_report
except ImportError:
    generate_load_report = None


@pytest.fixture(scope="module")
def load_results(load_users, load_duration):
    csv_path = asyncio.get_event_loop().run_until_complete(
        run_load_tests(users=load_users, duration_sec=load_duration)
    )
    return parse_csv_stats(csv_path)


@pytest.mark.load
class TestApiLoad:

    def test_health_endpoint_p95(self, load_results):
        stats = load_results.get("health", {})
        assert stats, "No health endpoint results found"
        p95 = stats["p95"]
        assert p95 < 500, f"Health p95 {p95}ms exceeds 500ms threshold"

    def test_health_error_rate(self, load_results):
        stats = load_results.get("health", {})
        assert stats["error_rate"] < 1.0, f"Health error rate {stats['error_rate']}% >= 1%"

    def test_analyse_endpoint_p95(self, load_results):
        stats = load_results.get("analyse", {})
        assert stats, "No analyse endpoint results found"
        p95 = stats["p95"]
        threshold = P95_THRESHOLD
        assert p95 < threshold, f"Analyse p95 {p95}ms exceeds {threshold}ms threshold"

    def test_analyse_error_rate(self, load_results):
        stats = load_results.get("analyse", {})
        assert stats["error_rate"] < 5.0, f"Analyse error rate {stats['error_rate']}% >= 5%"

    def test_chat_endpoint_p95(self, load_results):
        stats = load_results.get("chat", {})
        if not stats:
            pytest.skip("No chat results")
        p95 = stats["p95"]
        assert p95 < 30000, f"Chat p95 {p95}ms exceeds 30s threshold"

    def test_no_endpoint_crashes(self, load_results):
        for ep, stats in load_results.items():
            assert stats["error_rate"] < 10.0, \
                f"Endpoint '{ep}' error rate {stats['error_rate']}% is too high"


@pytest.mark.load
class TestUploadLoad:

    def test_upload_under_concurrent_load(self, load_users):
        csv_path = asyncio.get_event_loop().run_until_complete(
            run_upload_load(users=min(load_users, 5), duration_sec=20)
        )
        stats = parse_csv_stats(csv_path)
        upload_stats = stats.get("upload", {})
        if not upload_stats:
            pytest.skip("No upload results")
        assert upload_stats["error_rate"] < 10.0, \
            f"Upload error rate {upload_stats['error_rate']}% too high under load"
        assert upload_stats["p95"] < 30000, \
            f"Upload p95 {upload_stats['p95']}ms exceeds 30s threshold"
