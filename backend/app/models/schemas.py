from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    context_docs: list[str] = []


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    tool_calls_made: list[str] = []
    trace_id: str
    trace_url: str | None = None


class LoanRequest(BaseModel):
    income: float
    loan_amount: float
    credit_score: int
    loan_type: str        # fixed | variable | fha
    employment: str       # employed | self_employed | retired


class LoanResponse(BaseModel):
    product: str
    rate: float
    eligible: bool
    reasoning: str
    trace_id: str


class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    status: str


