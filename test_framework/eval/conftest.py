import os
import sys
import pytest
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

API_URL = os.getenv("API_URL", "http://localhost:8000")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")


@pytest.fixture(scope="session")
def api_url():
    return API_URL
