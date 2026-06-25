"""
Load tests for FinEval API.
Run from test_framework/load/:
  python runner.py [users] [duration_sec]
Or via pytest:
  pytest tests/test_api_load.py -v --users 5 --duration 15
"""
import asyncio
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import P95_THRESHOLD
from runner import run_load_tests, parse_csv_stats


@pytest.fixture(scope="module")
def load_results(load_users, load_duration):
    csv_path = asyncio.run(run_load_tests(users=load_users, duration_sec=load_duration))
    return parse_csv_stats(csv_path)


@pytest.mark.load
class TestApiLoad:

    def test_health_p95_under_500ms(self, load_results):
        stats = load_results.get("health", {})
        assert stats, "No health results"
        assert stats["p95"] < 500, f"Health p95 {stats['p95']}ms > 500ms"

    def test_analyse_p95_under_threshold(self, load_results):
        stats = load_results.get("analyse", {})
        assert stats, "No analyse results"
        assert stats["p95"] < P95_THRESHOLD, \
            f"Analyse p95 {stats['p95']}ms > {P95_THRESHOLD}ms"

    def test_all_endpoints_error_rate_under_5pct(self, load_results):
        for ep, stats in load_results.items():
            assert stats["error_rate"] < 5.0, \
                f"Endpoint '{ep}' error rate {stats['error_rate']}% >= 5%"
