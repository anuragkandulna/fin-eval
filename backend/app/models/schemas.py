from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    context_docs: list[str] = []


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    tool_calls_made: list[str] = []
    trace_id: str


class DebtItem(BaseModel):
    name: str
    balance: float
    rate: float   # annual rate as decimal, e.g. 0.36 for 36%


class AnalyseRequest(BaseModel):
    income: float
    needs: float
    wants: float
    current_savings: float = 0.0
    savings_goal: float = 0.0
    debts: list[DebtItem] = []
    monthly_debt_payment: float = 5000.0
    projection_years: int = 10
    annual_return: float = 0.08
    session_id: str = "default"


class AnalyseResponse(BaseModel):
    response: str
    health_score: int | None = None
    health_label: str | None = None
    actual_savings: float | None = None
    surplus_deficit: float | None = None
    projected_value: float | None = None
    tool_calls_made: list[str] = []
    trace_id: str


class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    status: str
