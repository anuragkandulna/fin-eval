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
    @pytest.mark.analyse
    def test_unhealthy_budget(self):
        self.analyse.fill_budget_form(
            income=50000, needs=40000, wants=12000, savings=0, goal=10000
        )
        self.analyse.submit()
        self.analyse.wait_for_result()
        label = self.analyse.get_health_label()
        assert label in ["fair", "poor"], f"Expected fair/poor, got '{label}'"

    @allure.title("Analysis card shows educational disclaimer")
    @pytest.mark.regression
    def test_disclaimer_present(self):
        self.analyse.fill_budget_form(80000, 35000, 20000, 25000, 16000)
        self.analyse.submit()
        self.analyse.wait_for_result()
        card_text = self.analyse.get_card_text().lower()
        assert any(term in card_text for term in [
            "educational", "not professional", "not financial advice"
        ]), "Disclaimer missing from analysis card"

    @allure.title("Health score is a number between 0 and 100")
    @pytest.mark.regression
    def test_health_score_numeric(self):
        self.analyse.fill_budget_form(80000, 35000, 20000, 25000, 16000)
        self.analyse.submit()
        self.analyse.wait_for_result()
        score_text = self.analyse.get_health_score()
        score = int("".join(filter(str.isdigit, score_text)))
        assert 0 <= score <= 100, f"Score {score} out of 0-100 range"
