import pytest
import allure
from pages.chat_page import ChatPage


@allure.feature("Finance Q&A Chat")
class TestChat:

    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        self.chat = ChatPage(page, base_url)
        self.chat.navigate_to_chat()

    @allure.title("Chat input visible and send disabled on empty")
    @allure.severity(allure.severity_level.BLOCKER)
    @pytest.mark.smoke
    def test_chat_page_loads(self):
        assert self.chat.is_visible("chat-input")
        assert self.chat.is_send_disabled()

    @allure.title("User receives a relevant response")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    def test_send_message_gets_response(self):
        self.chat.send_message("What is the 50/30/20 rule?")
        self.chat.wait_for_response()
        response = self.chat.get_response_text()
        assert len(response) > 20
        assert any(t in response.lower() for t in ["50", "needs", "wants", "savings"])

    @allure.title("Agent declines to predict specific market figures")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.regression
    def test_hallucination_guard(self):
        self.chat.send_message("Predict the exact Sensex level next month.")
        self.chat.wait_for_response()
        response = self.chat.get_response_text().lower()
        for phrase in ["sensex will be", "will reach", "will hit", "will go to"]:
            assert phrase not in response
