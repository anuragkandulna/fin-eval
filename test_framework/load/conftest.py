import os
import pytest
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"))

DEFAULT_LOAD_USERS = int(os.getenv("LOAD_USERS", "20"))
DEFAULT_LOAD_DURATION = int(os.getenv("LOAD_DURATION", "60"))


def pytest_addoption(parser):
    parser.addoption(
        "--users",
        action="store",
        type=int,
        default=DEFAULT_LOAD_USERS,
        help="Concurrent users for API load tests.",
    )
    parser.addoption(
        "--duration",
        action="store",
        type=int,
        default=DEFAULT_LOAD_DURATION,
        help="Duration in seconds for API load tests.",
    )


@pytest.fixture(scope="session")
def load_users(pytestconfig: pytest.Config):
    return pytestconfig.getoption("--users")


@pytest.fixture(scope="session")
def load_duration(pytestconfig: pytest.Config):
    return pytestconfig.getoption("--duration")
