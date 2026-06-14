from app.rag.ingest import get_vectorstore
import structlog

logger = structlog.get_logger()

TOP_K = 4


async def retrieve_docs(query: str) -> tuple[list[str], list[str]]:
    results = get_vectorstore().similarity_search_with_score(query, k=TOP_K)

    # Qdrant cosine similarity: higher score = more similar (opposite of ChromaDB distance)
    relevant = [(doc, score) for doc, score in results if score > 0.5]

    if not relevant:
        logger.warning("no_relevant_docs", query=query)
        return [], []

    texts = [doc.page_content for doc, _ in relevant]
    sources = [doc.metadata.get("source", "unknown") for doc, _ in relevant]

    logger.info("retrieved_docs", count=len(texts), query=query[:50])
    return texts, sources
