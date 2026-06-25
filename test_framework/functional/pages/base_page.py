import allure
from playwright.sync_api import Page


class BasePage:
    def __init__(self, page: Page, base_url: str):
        self.page = page
        self.base_url = base_url

    def navigate(self, path: str = ""):
        with allure.step(f"Navigate to {self.base_url}{path}"):
            self.page.goto(f"{self.base_url}{path}")
            self.page.wait_for_load_state("networkidle")

    def get_element(self, testid: str):
        return self.page.locator(f'[data-testid="{testid}"]')

    def click(self, testid: str, description: str = ""):
        with allure.step(f"Click: {description or testid}"):
            self.get_element(testid).click()

    def fill(self, testid: str, value: str, description: str = ""):
        with allure.step(f"Fill {description or testid} with '{value}'"):
            self.get_element(testid).fill(value)

    def wait_for(self, testid: str, timeout: int = 20000):
        with allure.step(f"Wait for element: {testid}"):
            self.get_element(testid).wait_for(state="visible", timeout=timeout)

    def get_text(self, testid: str) -> str:
        return self.get_element(testid).inner_text()

    def is_visible(self, testid: str) -> bool:
        return self.get_element(testid).is_visible()
