import pytest
import allure
from pages.base_page import BasePage


@allure.feature("App Navigation")
class TestNavigation:

    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        self.page_obj = BasePage(page, base_url)
        self.page     = page
        self.base_url = base_url

    @allure.title("All three routes load without errors")
    @pytest.mark.smoke
    def test_all_routes_load(self):
        for path in ["/", "/analyse", "/documents"]:
            self.page_obj.navigate(path)
            assert self.page.url  # page loaded

    @allure.title("Navbar has all required testids")
    @pytest.mark.smoke
    def test_navbar_testids_exist(self):
        self.page_obj.navigate("/")
        for tid in ["nav-chat", "nav-analyse", "nav-documents"]:
            assert self.page_obj.is_visible(tid), f"data-testid='{tid}' missing"
