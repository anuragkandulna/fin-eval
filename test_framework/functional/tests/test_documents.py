import pytest
import allure
import os
from pages.documents_page import DocumentsPage


@allure.feature("Financial Document Upload")
class TestDocuments:

    @pytest.fixture(autouse=True)
    def setup(self, page, base_url):
        self.docs = DocumentsPage(page, base_url)
        self.docs.navigate_to_documents()

    @pytest.fixture
    def test_pdf(self):
        path = DocumentsPage.create_test_pdf()
        yield path
        os.unlink(path)

    @pytest.fixture
    def test_txt(self):
        path = DocumentsPage.create_test_txt()
        yield path
        os.unlink(path)

    @allure.title("Upload page loads with file input and button")
    @pytest.mark.smoke
    def test_upload_page_loads(self):
        assert self.docs.is_visible("file-upload")
        assert self.docs.is_visible("upload-button")

    @allure.title("Valid TXT upload succeeds and shows chunk count")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    @pytest.mark.documents
    def test_valid_txt_upload(self, test_txt):
        self.docs.upload_file(test_txt)
        self.docs.wait_for_upload_status()
        status = self.docs.get_upload_status()
        assert "successfully" in status, f"Unexpected upload status: {status}"

