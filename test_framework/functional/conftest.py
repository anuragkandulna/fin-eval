import sys
import os
import pytest
import allure
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

BASE_URL     = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS     = os.getenv("HEADLESS", "true").lower() == "true"
BROWSER_TYPE = os.getenv("BROWSER", "chromium")


def pytest_configure(config):
    config.addinivalue_line("markers", "smoke: smoke test suite")
    config.addinivalue_line("markers", "regression: regression test suite")
    config.addinivalue_line("markers", "chat: chat feature tests")
    config.addinivalue_line("markers", "analyse: budget analyser tests")
    config.addinivalue_line("markers", "documents: document upload tests")


@pytest.fixture(scope="session")
def browser_type_name():
    return BROWSER_TYPE


@pytest.fixture(scope="session")
def playwright_instance():
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def browser(playwright_instance, browser_type_name):
    launcher = getattr(playwright_instance, browser_type_name)
    b = launcher.launch(headless=HEADLESS)
    yield b
    b.close()


@pytest.fixture(scope="function")
def page(browser):
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        record_video_dir="videos/" if os.getenv("RECORD_VIDEO") else None,
    )
    p = context.new_page()
    yield p
    try:
        p.screenshot(path="screenshot.png")
        allure.attach.file(
            "screenshot.png",
            name="screenshot",
            attachment_type=allure.attachment_type.PNG,
        )
    except Exception:
        pass
    context.close()


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL
