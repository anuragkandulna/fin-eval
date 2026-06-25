import urllib.parse
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# Build an aioodbc ODBC connection string from the DATABASE_URL.
# DATABASE_URL format in .env: mssql://user:pass@server:1433/database
_u = make_url(settings.database_url)
_odbc = (
    f"DRIVER={{ODBC Driver 18 for SQL Server}};"
    f"SERVER=tcp:{_u.host},{_u.port or 1433};"
    f"DATABASE={_u.database};"
    f"UID={_u.username};"
    f"PWD={_u.password};"
    f"Encrypt=yes;TrustServerCertificate=no;MARS_Connection=yes;"
)
_async_url = f"mssql+aioodbc:///?odbc_connect={urllib.parse.quote_plus(_odbc)}"

engine = create_async_engine(_async_url, echo=False)

AsyncSessionLocal = sessionmaker(
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
