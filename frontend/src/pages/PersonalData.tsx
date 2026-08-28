import { useState, type ElementType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery }    from '@tanstack/react-query'
import {
  IconUser,
  IconBriefcase,
  IconTarget,
  IconReceipt,
  IconCash,
  IconAlertTriangle,
  IconCheck,
  IconChevronUp,
  IconChevronDown,
  IconFile,
} from '@tabler/icons-react'
import { getPersonalData }  from '../api/client'
import type {
  FinancialGoal,
  SalaryCredit,
  BudgetCategoryData,
  UserProfileData,
  TaxSummary,
} from '../api/client'
import { formatINR } from '../utils/currency'

function Section({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <div className="bg-card rounded-lg border-thin overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 separator-soft-b">
        <Icon size={15} stroke={1.5} className="text-secondary flex-shrink-0" />
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '0.5px solid var(--color-border)' }}>
      <span className="text-xs text-secondary">{label}</span>
      <span className={`text-xs text-ink ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  )
}

function GoalCard({ goal }: { goal: FinancialGoal }) {
  const pct = Math.round((goal.saved / goal.target) * 100)
  return (
    <div className="py-2.5" style={{ borderBottom: '0.5px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-ink">{goal.name}</span>
        <span className="text-xs text-secondary font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-brand-tint overflow-hidden mb-1">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between">
        <span className="text-[11px] text-secondary">₹{(goal.saved / 1000).toFixed(0)}k saved</span>
        <span className="text-[11px] text-secondary">₹{(goal.target / 1000).toFixed(0)}k · {goal.horizon}</span>
      </div>
    </div>
  )
}

type Status = 'on-time' | 'late' | 'pending'
const STATUS_STYLE: Record<Status, { cls: string; label: string }> = {
  'on-time': { cls: 'status-pass', label: '✓ On time' },
  'late':    { cls: 'status-warn', label: '⚠ Late'    },
  'pending': { cls: 'status-run',  label: '· Pending'  },
}

// ── Fallback data (shown while loading or if seed not run) ──────────────────

const FALLBACK_PROFILE: UserProfileData = {
  full_name: 'John Doe', city: 'Bangalore, KA', employer: 'TechCorp Pvt Ltd',
  take_home_monthly: 80000, annual_ctc: 1440000,
  next_credit_date: 'Jul 1, 2026', tax_regime: 'New regime · FY 2025-26',
}
const FALLBACK_TAX: TaxSummary = { gross_annual: 1440000, standard_deduction: 75000, net_taxable: 1365000, tax_with_cess: 91666 }
const FALLBACK_GOALS: FinancialGoal[] = [
  { name: 'Emergency fund',    target: 240000,  saved: 120000, horizon: '12 months' },
  { name: 'Vacation — Bali',   target: 50000,   saved: 18500,  horizon: '6 months'  },
  { name: 'Home down payment', target: 1200000, saved: 180000, horizon: '5 years'   },
]
const FALLBACK_SALARY: SalaryCredit[] = [
  { month: 'Jun 2026', expected_date: 'Jun 1', credited_date: 'Jun 1', amount: 80000, status: 'on-time', doc_id: 'salary_slip_june' },
  { month: 'May 2026', expected_date: 'May 1', credited_date: 'May 2', amount: 80000, status: 'late',    doc_id: null },
  { month: 'Apr 2026', expected_date: 'Apr 1', credited_date: 'Apr 1', amount: 80000, status: 'on-time', doc_id: null },
  { month: 'Mar 2026', expected_date: 'Mar 1', credited_date: 'Mar 1', amount: 82000, status: 'on-time', doc_id: null },
  { month: 'Feb 2026', expected_date: 'Feb 1', credited_date: 'Feb 3', amount: 80000, status: 'late',    doc_id: null },
  { month: 'Jan 2026', expected_date: 'Jan 1', credited_date: 'Jan 1', amount: 80000, status: 'on-time', doc_id: null },
]
const FALLBACK_BUDGET: BudgetCategoryData[] = [
  { name: 'Housing',       budget: 25000, spent: 25000 },
  { name: 'Food & dining', budget: 12000, spent: 9800  },
  { name: 'Transport',     budget: 5000,  spent: 3200  },
  { name: 'Entertainment', budget: 5000,  spent: 6100  },
  { name: 'Health',        budget: 4000,  spent: 2800  },
  { name: 'Shopping',      budget: 8000,  spent: 5400  },
  { name: 'Savings / SIP', budget: 16000, spent: 14400 },
]

export default function PersonalData() {
  const [logExpanded, setLogExpanded] = useState(true)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['personal'],
    queryFn:  getPersonalData,
    staleTime: 5 * 60 * 1000,
  })

  const profile    = data?.profile      ?? FALLBACK_PROFILE
  const tax        = data?.tax_summary   ?? FALLBACK_TAX
  const goals      = data?.goals         ?? FALLBACK_GOALS
  const salary     = data?.salary_credits ?? FALLBACK_SALARY
  const budgetCats = data?.budget_categories ?? FALLBACK_BUDGET

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="min-h-full px-5 py-5 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-ink">Personal data</h1>
            <p className="text-xs text-secondary mt-0.5">FY 2025–26 · {profile.tax_regime}</p>
          </div>
          <button className="px-3 py-1.5 text-sm text-secondary rounded-md hover:bg-brand-tint transition-colors border-thin">
            Edit profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Section title="Profile" icon={IconUser}>
            <Row label="Full name"  value={profile.full_name} />
            <Row label="City"       value={profile.city} />
            <Row label="Tax regime" value={profile.tax_regime} />
          </Section>

          <Section title="Income" icon={IconBriefcase}>
            <Row label="Take-home"   value={`${formatINR(profile.take_home_monthly)} / month`} mono />
            <Row label="Annual CTC"  value={formatINR(profile.annual_ctc)}                      mono />
            <Row label="Employer"    value={profile.employer} />
            <Row label="Next credit" value={profile.next_credit_date} />
          </Section>

          <Section title="Financial goals" icon={IconTarget}>
            {goals.map(g => <GoalCard key={g.name} goal={g} />)}
          </Section>

          <Section title={`Tax summary — ${profile.tax_regime}`} icon={IconReceipt}>
            <div className="flex flex-col gap-1.5">
              <Row label="Gross annual income" value={formatINR(tax.gross_annual)}                         mono />
              <Row label="Standard deduction"  value={`− ${formatINR(tax.standard_deduction)}`}           mono />
              <Row label="Net taxable income"  value={formatINR(tax.net_taxable)}                          mono />
              <div className="flex justify-between items-center py-1.5 mt-1" style={{ borderTop: '0.5px solid var(--color-border)' }}>
                <span className="text-xs font-medium text-ink">Tax + 4% cess</span>
                <span className="text-xs font-mono font-semibold text-ink">≈ {formatINR(tax.tax_with_cess)}</span>
              </div>
              <p className="text-[11px] text-secondary mt-1 leading-snug">
                New regime: standard deduction only. No 80C / HRA / other deductions applicable.
              </p>
            </div>
          </Section>

        </div>

        {/* Salary credit log */}
        <Section title="Salary credit log" icon={IconCash}>
          <button
            className="flex items-center gap-1.5 text-xs text-secondary mb-3 hover:text-ink transition-colors"
            onClick={() => setLogExpanded(p => !p)}
          >
            {logExpanded ? <IconChevronUp size={12} stroke={2} /> : <IconChevronDown size={12} stroke={2} />}
            {logExpanded ? 'Collapse' : 'Expand'} · {salary.length} months
          </button>

          {logExpanded && (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-xs border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {['Month', 'Expected', 'Credited', 'Amount', 'Status', 'Slip'].map(h => (
                      <th
                        key={h}
                        className="text-left text-secondary font-medium pb-2 pr-4"
                        style={{ borderBottom: '0.5px solid var(--color-border)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salary.map(row => {
                    const st = STATUS_STYLE[row.status as Status] ?? STATUS_STYLE['pending']
                    return (
                      <tr key={row.month} className="hover:bg-brand-tint transition-colors">
                        <td className="py-2 pr-4 text-ink font-medium">{row.month}</td>
                        <td className="py-2 pr-4 text-secondary font-mono">{row.expected_date}</td>
                        <td className="py-2 pr-4 font-mono text-ink">{row.credited_date}</td>
                        <td className="py-2 pr-4 font-mono text-ink">{formatINR(row.amount)}</td>
                        <td className="py-2 pr-4">
                          <span className={`rounded px-1.5 py-0.5 font-medium ${st.cls}`} style={{ fontSize: 10 }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {row.doc_id ? (
                            <button
                              data-testid={`salary-doc-${row.month}`}
                              onClick={() => navigate(`/documents?highlight=${row.doc_id}`)}
                              className="flex items-center gap-1 text-brand hover:opacity-70 transition-opacity"
                              title="View salary slip"
                            >
                              <IconFile size={12} stroke={1.6} />
                              <span style={{ fontSize: 10 }}>View</span>
                            </button>
                          ) : (
                            <span className="text-secondary" style={{ fontSize: 10 }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Monthly budget tracker */}
        <Section title="Budget by category — Jun 2026" icon={IconTarget}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {budgetCats.map(cat => {
              const pct      = Math.round((cat.spent / cat.budget) * 100)
              const over     = pct > 100
              const barColor = over ? 'var(--color-fail)' : pct > 85 ? 'var(--color-warn)' : 'var(--color-brand)'
              return (
                <div key={cat.name} className="bg-snow rounded-lg p-3 border-thin">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-ink truncate">{cat.name}</span>
                    {over
                      ? <IconAlertTriangle size={11} stroke={2} className="text-fail flex-shrink-0" />
                      : <IconCheck size={11} stroke={2.5} className="text-pass flex-shrink-0" />
                    }
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-tint overflow-hidden mb-1.5">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] font-mono text-ink">₹{(cat.spent / 1000).toFixed(0)}k</span>
                    <span className={`text-[11px] font-mono ${over ? 'text-fail' : 'text-secondary'}`}>
                      {over ? '+' : ''}₹{(Math.abs(cat.budget - cat.spent) / 1000).toFixed(0)}k {over ? 'over' : 'left'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

      </div>
    </div>
  )
}
