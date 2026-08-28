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

export interface DocumentListItem {
  doc_id: string
  filename: string
  chunk_count: number
  status: 'indexed' | 'processing'
  created_at: string  // ISO 8601 UTC
}

export const getDocuments = () =>
  api.get<DocumentListItem[]>('/documents/list').then(r => r.data)

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface BudgetHealthData {
  health_score: number
  health_score_change: number
  savings_rate_pct: number
  savings_rate_target: number
  dti_pct: number
  dti_limit: number
  net_worth_inr: number
  net_worth_change_inr: number
  emergency_months: number
  emergency_target_months: number
  monthly_surplus_inr: number
  monthly_income_inr: number
  ai_insight: string
}

export interface MonthlyMetric {
  month: string
  income: number
  spend: number
}

export interface SpendSegment {
  label: string
  pct: number
  amount: number | null
  segment_type: 'donut' | 'breakdown'
}

export interface TopCategory {
  name: string
  amount: number
  pct: number
  wow: number
  wow_dir: 'up' | 'down' | 'flat'
}

export interface RecommendationItem {
  title: string
  detail: string
  impact: 'high' | 'medium' | 'low'
  is_alert: boolean
}

export interface DashboardData {
  budget_health: BudgetHealthData
  monthly_metrics: MonthlyMetric[]
  spend_segments: SpendSegment[]
  top_categories: TopCategory[]
  recommendations: RecommendationItem[]
  alerts: RecommendationItem[]
}

export const getDashboard = () =>
  api.get<DashboardData>('/dashboard').then(r => r.data)

// ── Personal data ──────────────────────────────────────────────────────────

export interface UserProfileData {
  full_name: string
  city: string
  employer: string
  take_home_monthly: number
  annual_ctc: number
  next_credit_date: string
  tax_regime: string
}

export interface TaxSummary {
  gross_annual: number
  standard_deduction: number
  net_taxable: number
  tax_with_cess: number
}

export interface FinancialGoal {
  name: string
  target: number
  saved: number
  horizon: string
}

export interface SalaryCredit {
  month: string
  expected_date: string
  credited_date: string
  amount: number
  status: 'on-time' | 'late' | 'pending'
  doc_id: string | null
}

export interface BudgetCategoryData {
  name: string
  budget: number
  spent: number
}

export interface PersonalData {
  profile: UserProfileData
  tax_summary: TaxSummary
  goals: FinancialGoal[]
  salary_credits: SalaryCredit[]
  budget_categories: BudgetCategoryData[]
}

export const getPersonalData = () =>
  api.get<PersonalData>('/personal').then(r => r.data)
