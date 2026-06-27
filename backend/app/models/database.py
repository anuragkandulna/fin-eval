import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


def _build_async_url(url: str) -> str:
    """Normalise a postgresql:// or postgres:// URL to the asyncpg dialect.

    Neon passes ?sslmode=require in the URL; asyncpg does not recognise that
    query parameter so it is stripped — SSL is enforced via connect_args.
    """
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            base = url.replace(prefix, "postgresql+asyncpg://", 1)
            # Drop any query string; SSL handled by connect_args below
            return base.split("?")[0]
    raise ValueError(f"Unsupported DATABASE_URL scheme: {url!r}")


_ssl_ctx = ssl.create_default_context()

engine = create_async_engine(
    _build_async_url(settings.database_url),
    echo=False,
    connect_args={"ssl": _ssl_ctx},
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
