import axios from 'axios'

// In dev, Vite proxy forwards these paths to localhost:8000.
// In production, nginx handles the same proxy.
const api = axios.create({ timeout: 60000 })

export interface ChatRequest {
  message: string
  session_id: string
  context_docs: string[]
}

export interface ChatResponse {
  response: string
  sources: string[]
  tool_calls_made: string[]
  trace_id: string
  trace_url: string | null
}

export interface DebtItem {
  name: string
  balance: number
  rate: number
}

export interface AnalyseRequest {
  income: number
  needs: number
  wants: number
  current_savings: number
  savings_goal: number
  debts: DebtItem[]
  monthly_debt_payment: number
  projection_years: number
  annual_return: number
  session_id: string
}

export interface AnalyseResponse {
  response: string
  health_score: number | null
  health_label: string | null
  actual_savings: number | null
  surplus_deficit: number | null
  projected_value: number | null
  tool_calls_made: string[]
  trace_id: string
  trace_url: string | null
}

export interface DocumentResponse {
  doc_id: string
  filename: string
  chunks: number
  status: string
}

export const sendChat = (data: ChatRequest) =>
  api.post<ChatResponse>('/chat', data).then(r => r.data)

export const analyseFinances = (data: AnalyseRequest) =>
  api.post<AnalyseResponse>('/analyse', data).then(r => r.data)

export const uploadDocument = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<DocumentResponse>('/documents/upload', form).then(r => r.data)
}
