import sys
import os
import time
import tempfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from reports.generate_report import generate_performance_report


def create_test_txt(size_kb: int = 10) -> str:
    content = ("Emergency fund: save 3-6 months of living expenses. " * 50).encode()[:size_kb * 1024]
    f = tempfile.NamedTemporaryFile(suffix=".txt", delete=False)
    f.write(content)
    f.close()
    return f.name


@pytest.mark.performance
class TestUploadPerformance:

    @pytest.fixture(params=[10, 50])
    def txt_file(self, request):
        path = create_test_txt(request.param)
        yield path, request.param
        os.unlink(path)

    def test_upload_time(self, perf_browser, base_url, emitter, iterations, txt_file):
        page = perf_browser
        file_path, size_kb = txt_file

        for iteration in range(1, iterations + 1):
            page.goto(f"{base_url}/documents", wait_until="networkidle")

            start_sel = time.perf_counter()
            page.set_input_files('[data-testid="file-upload"]', file_path)
            emitter.record(f"file_selection_{size_kb}kb", start_sel, time.perf_counter(),
                           iteration, {"size_kb": size_kb})

            start_up = time.perf_counter()
            page.click('[data-testid="upload-button"]')
            page.wait_for_selector('[data-testid="upload-status"]', timeout=30000)
            emitter.record(f"upload_complete_{size_kb}kb", start_up, time.perf_counter(),
                           iteration, {"size_kb": size_kb})

        generate_performance_report(emitter.all_stats(), "reports/upload_report.html",
                                    title="Upload Performance")
