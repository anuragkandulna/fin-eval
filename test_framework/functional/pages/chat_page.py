import allure
from pages.base_page import BasePage


class ChatPage(BasePage):
    def navigate_to_chat(self):
        self.navigate("/")

    def send_message(self, message: str):
        with allure.step(f"Send chat message: '{message[:50]}'"):
            self.fill("chat-input", message)
            self.click("send-button", "Send message")

    def wait_for_response(self, timeout: int = 25000):
        with allure.step("Wait for assistant response"):
            self.wait_for("assistant-message", timeout=timeout)

    def get_response_text(self) -> str:
        return self.get_element("assistant-message").last.inner_text()

    def get_all_messages(self) -> list[str]:
        return self.page.locator('[data-testid="assistant-message"]').all_inner_texts()

    def is_send_disabled(self) -> bool:
        return self.get_element("send-button").is_disabled()

    def is_loading(self) -> bool:
        return self.is_visible("loading-indicator")
