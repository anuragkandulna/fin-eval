import sys
import os
import time
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from reports.generate_report import generate_performance_report

ROUTES = [
    ("/",          "home"),
    ("/analyse",   "analyse"),
    ("/documents", "documents"),
]


@pytest.mark.performance
class TestNavigationPerformance:

    def test_page_load_times(self, perf_browser, base_url, emitter, iterations):
        page = perf_browser
        for iteration in range(1, iterations + 1):
            for route, name in ROUTES:
                start = time.perf_counter()
                page.goto(f"{base_url}{route}", wait_until="networkidle", timeout=30000)
                emitter.record(f"page_load_{name}", start, time.perf_counter(), iteration,
                               {"route": route})

                start2 = time.perf_counter()
                page.wait_for_load_state("domcontentloaded")
                emitter.record(f"tti_{name}", start2, time.perf_counter(), iteration,
                               {"route": route})

        generate_performance_report(emitter.all_stats(), "reports/navigation_report.html",
                                    title="Page Load Performance")

    def test_route_change_time(self, perf_browser, base_url, emitter, iterations):
        page = perf_browser
        page.goto(base_url, wait_until="networkidle")

        for iteration in range(1, iterations + 1):
            for testid, dest, name in [
                ("nav-analyse",   "/analyse",   "analyse"),
                ("nav-documents", "/documents", "documents"),
                ("nav-chat",      "/",          "home"),
            ]:
                start = time.perf_counter()
                if page.locator(f'[data-testid="{testid}"]').is_visible():
                    page.click(f'[data-testid="{testid}"]')
                else:
                    page.goto(f"{base_url}{dest}")
                page.wait_for_load_state("networkidle")
                emitter.record(f"route_change_to_{name}", start, time.perf_counter(), iteration)

        generate_performance_report(emitter.all_stats(), "reports/navigation_report.html",
                                    title="Route Change Performance")

    def test_chat_button_to_response(self, perf_browser, base_url, emitter, iterations):
        page = perf_browser
        for iteration in range(1, iterations + 1):
            page.goto(base_url, wait_until="networkidle")
            page.fill('[data-testid="chat-input"]', "What is the 50/30/20 rule?")

            start = time.perf_counter()
            page.click('[data-testid="send-button"]')
            page.wait_for_selector('[data-testid="assistant-message"]', timeout=30000)
            emitter.record("chat_button_to_response", start, time.perf_counter(), iteration)

        stats = emitter.all_stats()
        generate_performance_report(stats, "reports/chat_perf_report.html",
                                    title="Chat Response Time")
        p95 = next((s["p95"] for s in stats if s["action"] == "chat_button_to_response"), None)
        assert p95 is None or p95 < 25000, f"Chat p95 {p95}ms exceeds 25s threshold"
