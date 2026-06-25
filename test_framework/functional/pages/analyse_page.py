import allure
from pages.base_page import BasePage


class AnalysePage(BasePage):
    def navigate_to_analyse(self):
        self.navigate("/analyse")

    def fill_budget_form(self, income, needs, wants, savings, goal):
        with allure.step("Fill budget analysis form"):
            self.fill("income",          str(income))
            self.fill("needs",           str(needs))
            self.fill("wants",           str(wants))
            self.fill("current-savings", str(savings))
            self.fill("savings-goal",    str(goal))

    def submit(self):
        self.click("submit-analyse", "Submit budget form")

    def wait_for_result(self, timeout: int = 25000):
        with allure.step("Wait for analysis result"):
            self.wait_for("analysis-card", timeout=timeout)

    def get_health_score(self) -> str:
        return self.get_text("health-score")

    def get_health_label(self) -> str:
        return self.get_text("health-label").lower()

    def get_card_text(self) -> str:
        return self.get_text("analysis-card")
