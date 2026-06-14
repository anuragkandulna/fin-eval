from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from app.config import settings
import os
import structlog

logger = structlog.get_logger()

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
EMBEDDING_DIM = 1536   # text-embedding-ada-002 / text-embedding-3-small


def get_vectorstore() -> QdrantVectorStore:
    client = QdrantClient(url=settings.qdrant_url)

    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
        logger.info("qdrant_collection_created", name=settings.qdrant_collection)

    embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
    return QdrantVectorStore(
        client=client,
        collection_name=settings.qdrant_collection,
        embedding=embeddings,
    )


async def ingest_file(file_path: str, doc_id: str) -> int:
    logger.info("ingesting_file", path=file_path, doc_id=doc_id)

    loader = PyPDFLoader(file_path) if file_path.endswith(".pdf") else TextLoader(file_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " "],
    )
    chunks = splitter.split_documents(docs)

    for chunk in chunks:
        chunk.metadata["doc_id"] = doc_id
        chunk.metadata["source"] = os.path.basename(file_path)

    get_vectorstore().add_documents(chunks)
    logger.info("ingested", chunks=len(chunks), doc_id=doc_id)
    return len(chunks)


async def ingest_directory(dir_path: str) -> None:
    for filename in os.listdir(dir_path):
        if filename.endswith((".txt", ".pdf")):
            await ingest_file(
                os.path.join(dir_path, filename),
                filename.replace(".", "_"),
            )
    logger.info("directory_ingested", path=dir_path)
