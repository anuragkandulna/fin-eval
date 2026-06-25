import sys
import os
import pytest
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

BASE_URL   = os.getenv("BASE_URL", "http://localhost:3000")
DEFAULT_HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"
ITERATIONS = min(int(os.getenv("ITERATIONS", "3")), 5)
CDP_PORT   = int(os.getenv("CDP_PORT", "9222"))


def pytest_addoption(parser):
    parser.addoption(
        "--headless",
        action="store_true",
        default=False,
        help="Run browser performance tests in headless mode.",
    )


def _resolve_headless(pytestconfig: pytest.Config) -> bool:
    if pytestconfig.getoption("headed"):
        return False
    if pytestconfig.getoption("--headless"):
        return True
    return DEFAULT_HEADLESS


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
def headless_mode(pytestconfig: pytest.Config):
    return _resolve_headless(pytestconfig)


@pytest.fixture(scope="function")
def browser_type_name(pytestconfig: pytest.Config):
    return pytestconfig.getoption("browser") or "chromium"


@pytest.fixture(scope="function")
def perf_browser(browser_type_name, headless_mode):
    with sync_playwright() as p:
        launch_args = ["--no-sandbox", "--disable-dev-shm-usage"]
        if browser_type_name == "chromium":
            launch_args.insert(0, f"--remote-debugging-port={CDP_PORT}")

        browser = getattr(p, browser_type_name).launch(
            headless=headless_mode,
            args=launch_args,
        )
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page    = context.new_page()
        yield page
        context.close()
        browser.close()
