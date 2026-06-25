import sys
import os
import pytest
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

BASE_URL   = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS   = os.getenv("HEADLESS", "true").lower() == "true"
ITERATIONS = min(int(os.getenv("ITERATIONS", "3")), 5)
CDP_PORT   = int(os.getenv("CDP_PORT", "9222"))


@pytest.fixture(scope="session")
def emitter():
    from emitter.metrics_emitter import MetricsEmitter
    return MetricsEmitter(output_path="data/metrics.jsonl")


@pytest.fixture(scope="session")
def iterations():
    return ITERATIONS


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="function")
def perf_browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=HEADLESS,
            args=[
                f"--remote-debugging-port={CDP_PORT}",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page    = context.new_page()
        yield page
        context.close()
        browser.close()
