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

    @allure.title("Home page loads")
    @pytest.mark.smoke
    def test_home_loads(self):
        self.page_obj.navigate("/")
        assert self.page.title() is not None

    @allure.title("Navigate to /analyse")
    @pytest.mark.smoke
    def test_analyse_route(self):
        self.page_obj.navigate("/analyse")
        assert "/analyse" in self.page.url

    @allure.title("Navigate to /documents")
    @pytest.mark.smoke
    def test_documents_route(self):
        self.page_obj.navigate("/documents")
        assert "/documents" in self.page.url

    @allure.title("Unknown route redirects to home")
    @pytest.mark.regression
    def test_unknown_route_redirects(self):
        self.page_obj.navigate("/unknown-route-xyz")
        self.page.wait_for_load_state("networkidle")
        assert self.page.url.rstrip("/").endswith(self.base_url.rstrip("/")) or "/" == self.page.url.split(self.base_url)[-1]

    @allure.title("Navbar links navigate correctly")
    @pytest.mark.regression
    def test_navbar_links(self):
        self.page_obj.navigate("/")
        nav_cases = [
            ("nav-analyse",   "/analyse"),
            ("nav-documents", "/documents"),
            ("nav-chat",      "/"),
        ]
        for testid, expected_path in nav_cases:
            if self.page_obj.is_visible(testid):
                self.page_obj.click(testid)
                self.page.wait_for_load_state("networkidle")
                assert expected_path in self.page.url, \
                    f"Expected {expected_path} in URL after clicking {testid}, got {self.page.url}"
