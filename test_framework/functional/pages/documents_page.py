import allure
import os
import tempfile
from pages.base_page import BasePage


class DocumentsPage(BasePage):
    def navigate_to_documents(self):
        self.navigate("/documents")

    def upload_file(self, file_path: str):
        with allure.step(f"Upload file: {os.path.basename(file_path)}"):
            self.page.set_input_files('[data-testid="file-upload"]', file_path)
            self.click("upload-button", "Upload")

    def wait_for_upload_status(self, timeout: int = 30000):
        with allure.step("Wait for upload status"):
            self.wait_for("upload-status", timeout=timeout)

    def get_upload_status(self) -> str:
        return self.get_text("upload-status").lower()

    @staticmethod
    def create_test_pdf() -> str:
        content = (
            b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
            b"xref\n0 4\n0000000000 65535 f\n"
            b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF"
        )
        f = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        f.write(content)
        f.close()
        return f.name

    @staticmethod
    def create_test_txt() -> str:
        content = b"Emergency fund basics: Save 3-6 months of expenses in a liquid account."
        f = tempfile.NamedTemporaryFile(suffix=".txt", delete=False)
        f.write(content)
        f.close()
        return f.name
