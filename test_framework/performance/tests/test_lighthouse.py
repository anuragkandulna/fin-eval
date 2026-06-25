import sys
import os
import time
import json
import subprocess
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from emitter.metrics_emitter import MetricsEmitter
from reports.generate_report import generate_lighthouse_report

CDP_PORT = int(os.getenv("CDP_PORT", "9222"))

ROUTES = [("/", "home"), ("/analyse", "analyse"), ("/documents", "documents")]

THRESHOLDS = {
    "performance":    70,
    "accessibility":  85,
    "best-practices": 80,
}


def run_lighthouse(url: str, output_path: str, headless_mode: bool) -> dict:
    cmd = [
        "npx", "lighthouse", url,
        f"--port={CDP_PORT}",
        "--output=json",
        f"--output-path={output_path}",
        "--quiet",
        "--only-categories=performance,accessibility,best-practices",
    ]
    if headless_mode:
        cmd.append("--chrome-flags=--headless=new")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if not os.path.exists(output_path):
        raise RuntimeError(f"Lighthouse failed for {url}: {result.stderr[:300]}")
    with open(output_path) as f:
        return json.load(f)


@pytest.mark.lighthouse
class TestLighthousePerformance:

    def test_lighthouse_scores(self, perf_browser, base_url, emitter, iterations, headless_mode, browser_type_name):
        if browser_type_name != "chromium":
            pytest.skip("Lighthouse tests require Chromium.")
        page = perf_browser
        all_results: dict[str, list] = {}
        os.makedirs("reports/lighthouse", exist_ok=True)

        for iteration in range(1, iterations + 1):
            for route, name in ROUTES:
                url = f"{base_url}{route}"
                output_path = f"reports/lighthouse/{name}_iter{iteration}.json"
                page.goto(url, wait_until="networkidle")

                start = time.perf_counter()
                try:
                    lh = run_lighthouse(url, output_path, headless_mode)
                except RuntimeError as e:
                    pytest.skip(f"Lighthouse unavailable: {e}")
                    continue

                categories = lh.get("categories", {})
                audits     = lh.get("audits", {})

                def score(key):
                    return round((categories.get(key, {}).get("score") or 0) * 100)

                def audit_val(key):
                    return round(audits.get(key, {}).get("numericValue") or 0)

                scores = {
                    "performance":    score("performance"),
                    "accessibility":  score("accessibility"),
                    "best-practices": score("best-practices"),
                    "fcp_ms":         audit_val("first-contentful-paint"),
                    "lcp_ms":         audit_val("largest-contentful-paint"),
                    "tbt_ms":         audit_val("total-blocking-time"),
                    "cls":            round(audits.get("cumulative-layout-shift", {}).get("numericValue") or 0, 3),
                }

                emitter.record(f"lighthouse_{name}", start, time.perf_counter(),
                               iteration, scores)
                all_results.setdefault(name, []).append(scores)

                for category, minimum in THRESHOLDS.items():
                    actual = scores.get(category, 0)
                    assert actual >= minimum, (
                        f"Lighthouse {category} score {actual} < {minimum} for {url}"
                    )

        generate_lighthouse_report(all_results, "reports/lighthouse_report.html")
