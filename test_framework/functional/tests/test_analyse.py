import pytest
import allure
from pages.analyse_page import AnalysePage


@allure.feature("Budget Health Analyser")
class TestAnalyse:

    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        self.analyse = AnalysePage(page, base_url)
        self.analyse.navigate_to_analyse()

    @allure.title("Budget form loads with all fields")
    @pytest.mark.smoke
    def test_form_loads(self):
        assert self.analyse.is_visible("income")
        assert self.analyse.is_visible("needs")
        assert self.analyse.is_visible("wants")
        assert self.analyse.is_visible("current-savings")
        assert self.analyse.is_visible("savings-goal")
        assert self.analyse.is_visible("submit-analyse")

    @allure.title("Healthy budget returns good/excellent label")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    @pytest.mark.analyse
    def test_healthy_budget(self):
        self.analyse.fill_budget_form(
            income=80000, needs=35000, wants=20000, savings=25000, goal=16000
        )
        self.analyse.submit()
        self.analyse.wait_for_result()
        label = self.analyse.get_health_label()
        assert label in ["excellent", "good"], f"Expected good/excellent, got '{label}'"

    @allure.title("Overspending budget returns fair/poor label")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.regression
    def test_unhealthy_budget_label(self):
        self.analyse.fill_budget_form(50000, 40000, 12000, 0, 10000)
        self.analyse.submit()
        self.analyse.wait_for_result()
        assert self.analyse.get_health_label() in ["fair", "poor"]
