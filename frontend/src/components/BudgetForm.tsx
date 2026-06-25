import { useState } from 'react'
import { analyseFinances } from '../api/client'
import type { AnalyseResponse } from '../api/client'

interface FormState {
  income: string
  needs: string
  wants: string
  current_savings: string
  savings_goal: string
}

const EMPTY: FormState = {
  income:          '',
  needs:           '',
  wants:           '',
  current_savings: '',
  savings_goal:    '',
}

const HEALTH_COLOURS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good:      'bg-blue-100 text-blue-700',
  fair:      'bg-yellow-100 text-yellow-700',
  poor:      'bg-red-100 text-red-700',
}

const fmt = (n: number | null | undefined) =>
  n != null ? `Rs ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'

export default function BudgetForm() {
  const [form, setForm]     = useState<FormState>(EMPTY)
  const [result, setResult] = useState<AnalyseResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await analyseFinances({
        income:               parseFloat(form.income),
        needs:                parseFloat(form.needs),
        wants:                parseFloat(form.wants),
        current_savings:      parseFloat(form.current_savings || '0'),
        savings_goal:         parseFloat(form.savings_goal || '0'),
        debts:                [],
        monthly_debt_payment: 5000,
        projection_years:     10,
        annual_return:        0.08,
        session_id:           'default',
      })
      setResult(res)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Analysis failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Budget Analyser</h2>
      <p className="text-sm text-gray-500 mb-6">Monthly figures in INR</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income (Rs)
          </label>
          <input
            data-testid="income"
            type="number"
            min="0"
            step="100"
            required
            value={form.income}
            onChange={set('income')}
            placeholder="80000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Needs — rent, groceries, utilities (Rs)
          </label>
          <input
            data-testid="needs"
            type="number"
            min="0"
            step="100"
            required
            value={form.needs}
            onChange={set('needs')}
            placeholder="40000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wants — dining, entertainment, subscriptions (Rs)
          </label>
          <input
            data-testid="wants"
            type="number"
            min="0"
            step="100"
            required
            value={form.wants}
            onChange={set('wants')}
            placeholder="15000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Monthly Savings (Rs)
          </label>
          <input
            data-testid="current-savings"
            type="number"
            min="0"
            step="100"
            value={form.current_savings}
            onChange={set('current_savings')}
            placeholder="10000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Savings Goal (Rs)
          </label>
          <input
            data-testid="savings-goal"
            type="number"
            min="0"
            step="100"
            value={form.savings_goal}
            onChange={set('savings_goal')}
            placeholder="16000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          data-testid="submit-analyse"
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {loading ? 'Analysing…' : 'Analyse My Budget'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div
          data-testid="analysis-card"
          className="mt-6 rounded-xl border border-gray-200 bg-white p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                data-testid="health-score"
                className="text-3xl font-bold text-gray-900"
              >
                {result.health_score ?? '—'}
              </span>
              <span className="text-gray-500 text-sm ml-1">/100</span>
            </div>
            {result.health_label && (
              <span
                data-testid="health-label"
                className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                  HEALTH_COLOURS[result.health_label] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {result.health_label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-gray-500 text-xs mb-0.5">Actual savings</p>
              <p className="font-semibold text-gray-900">{fmt(result.actual_savings)}</p>
            </div>
            <div className={`rounded-lg p-3 ${(result.surplus_deficit ?? 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-gray-500 text-xs mb-0.5">vs. goal</p>
              <p className={`font-semibold ${(result.surplus_deficit ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {result.surplus_deficit != null
                  ? `${result.surplus_deficit >= 0 ? '+' : ''}${fmt(result.surplus_deficit)}`
                  : '—'}
              </p>
            </div>
            {result.projected_value != null && (
              <div className="col-span-2 rounded-lg bg-blue-50 p-3">
                <p className="text-gray-500 text-xs mb-0.5">Projected value (10 yr, 8% assumed)</p>
                <p className="font-semibold text-blue-700">{fmt(result.projected_value)}</p>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-3">
            {result.response}
          </p>

          <p className="text-xs text-gray-400">
            This is educational information only, not professional financial advice.
          </p>
        </div>
      )}
    </div>
  )
}
