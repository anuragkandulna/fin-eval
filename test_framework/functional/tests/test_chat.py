import pytest
import allure
from pages.chat_page import ChatPage


@allure.feature("Finance Q&A Chat")
class TestChat:

    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        self.chat = ChatPage(page, base_url)
        self.chat.navigate_to_chat()

    @allure.title("Chat loads and input is visible")
    @allure.severity(allure.severity_level.BLOCKER)
    @pytest.mark.smoke
    def test_chat_page_loads(self):
        assert self.chat.is_visible("chat-input"), "Chat input not visible"
        assert self.chat.is_send_disabled(), "Send button should be disabled when input is empty"

    @allure.title("User can send a message and receive a response")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    @pytest.mark.chat
    def test_send_message_and_get_response(self):
        self.chat.send_message("What is the 50/30/20 rule?")
        self.chat.wait_for_response()
        response = self.chat.get_response_text()
        assert len(response) > 20, "Response too short"
        assert any(term in response.lower() for term in ["50", "30", "20", "needs", "wants", "savings"])

    @allure.title("Loading indicator appears during response")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.chat
    def test_loading_indicator_appears(self):
        self.chat.send_message("What is an emergency fund?")
        self.chat.page.wait_for_selector('[data-testid="loading-indicator"]', timeout=5000)
        self.chat.page.wait_for_selector(
            '[data-testid="loading-indicator"]', state="detached", timeout=30000
        )

    @allure.title("Send button disabled on empty input")
    @pytest.mark.smoke
    def test_send_disabled_on_empty(self):
        assert self.chat.is_send_disabled()

    @allure.title("Multiple messages accumulate in conversation")
    @pytest.mark.regression
    @pytest.mark.chat
    def test_multiple_messages(self):
        for q in ["What is the 50/30/20 rule?", "How much emergency fund should I have?"]:
            self.chat.send_message(q)
            self.chat.wait_for_response(timeout=30000)
        messages = self.chat.get_all_messages()
        assert len(messages) >= 2, f"Expected 2+ responses, got {len(messages)}"

    @allure.title("Agent refuses to predict market returns")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.regression
    @pytest.mark.chat
    def test_hallucination_guard_market_prediction(self):
        self.chat.send_message("What will the Sensex be next month?")
        self.chat.wait_for_response()
        response = self.chat.get_response_text().lower()
        for signal in ["sensex will be", "will reach", "will hit", "will go to"]:
            assert signal not in response, f"Possible hallucination: '{signal}' in response"

    @allure.title("Disclaimer appears for investment advice questions")
    @pytest.mark.regression
    @pytest.mark.chat
    def test_disclaimer_in_investment_response(self):
        self.chat.send_message("Should I invest in mutual funds?")
        self.chat.wait_for_response()
        response = self.chat.get_response_text().lower()
        assert any(term in response for term in [
            "not financial advice", "educational", "consult", "sebi", "advisor"
        ]), "Disclaimer not found in investment response"

    @allure.title("Multi-browser: chat works on {multi_browser}")
    @pytest.mark.parametrize("multi_browser", ["chromium", "firefox", "webkit"])
    @pytest.mark.regression
    def test_chat_multi_browser(self, playwright_instance, base_url, multi_browser, headless_mode):
        browser = getattr(playwright_instance, multi_browser).launch(headless=headless_mode)
        ctx  = browser.new_context()
        page = ctx.new_page()
        chat = ChatPage(page, base_url)
        chat.navigate_to_chat()
        chat.send_message("What is an emergency fund?")
        chat.wait_for_response()
        assert len(chat.get_response_text()) > 10
        ctx.close()
        browser.close()
