cd test_framework/eval
OPENAI_API_KEY=sk-... uv run pytest tests/ -v                    # all 16 tests
OPENAI_API_KEY=sk-... uv run pytest tests/ -m hallucination -v   # just 5 traps
OPENAI_API_KEY=sk-... uv run pytest tests/ -m rag -v             # just 6 RAG tests
