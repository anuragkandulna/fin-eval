import { useState, type ElementType, type ReactNode } from 'react'
import {
  IconUser,
  IconBriefcase,
  IconTarget,
  IconReceipt,
  IconCash,
  IconCheck,
  IconAlertTriangle,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react'
import DisclaimerBar  from '../components/DisclaimerBar'
import MobileBottomNav from '../components/MobileBottomNav'

/* ── Section wrapper ─────────────────────────────────────────── */
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

/* ── Goal progress bar ───────────────────────────────────────── */
interface Goal {
  name:    string
  target:  number
  saved:   number
  horizon: string
}

const GOALS: Goal[] = [
  { name: 'Emergency fund',   target: 240000,  saved: 120000,  horizon: '12 months'  },
  { name: 'Vacation — Bali',  target: 50000,   saved: 18500,   horizon: '6 months'   },
  { name: 'Home down payment', target: 1200000, saved: 180000,  horizon: '5 years'    },
]

function GoalCard({ goal }: { goal: Goal }) {
  const pct = Math.round((goal.saved / goal.target) * 100)
  return (
    <div className="py-2.5" style={{ borderBottom: '0.5px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-ink">{goal.name}</span>
        <span className="text-xs text-secondary font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-brand-tint overflow-hidden mb-1">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-[11px] text-secondary">₹{(goal.saved / 1000).toFixed(0)}k saved</span>
        <span className="text-[11px] text-secondary">₹{(goal.target / 1000).toFixed(0)}k target · {goal.horizon}</span>
      </div>
    </div>
  )
}

/* ── Salary credit log ───────────────────────────────────────── */
interface SalaryRow {
  month:    string
  expected: string
  credited: string
  amount:   string
  source:   string
  status:   'on-time' | 'late' | 'pending'
}

const SALARY_LOG: SalaryRow[] = [
  { month: 'Jun 2026', expected: 'Jun 1',  credited: 'Jun 1',  amount: '₹80,000', source: 'TechCorp Pvt Ltd', status: 'on-time' },
  { month: 'May 2026', expected: 'May 1',  credited: 'May 2',  amount: '₹80,000', source: 'TechCorp Pvt Ltd', status: 'late'    },
  { month: 'Apr 2026', expected: 'Apr 1',  credited: 'Apr 1',  amount: '₹80,000', source: 'TechCorp Pvt Ltd', status: 'on-time' },
  { month: 'Mar 2026', expected: 'Mar 1',  credited: 'Mar 1',  amount: '₹82,000', source: 'TechCorp Pvt Ltd', status: 'on-time' },
  { month: 'Feb 2026', expected: 'Feb 1',  credited: 'Feb 3',  amount: '₹80,000', source: 'TechCorp Pvt Ltd', status: 'late'    },
  { month: 'Jan 2026', expected: 'Jan 1',  credited: 'Jan 1',  amount: '₹80,000', source: 'TechCorp Pvt Ltd', status: 'on-time' },
]

const STATUS_STYLE: Record<SalaryRow['status'], { cls: string; label: string }> = {
  'on-time': { cls: 'status-pass', label: '✓ On time' },
  'late':    { cls: 'status-warn', label: '⚠ Late'    },
  'pending': { cls: 'status-run',  label: '· Pending'  },
}

/* ── Category budget tracker ─────────────────────────────────── */
interface BudgetCat {
  name:   string
  budget: number
  spent:  number
}

const BUDGET_CATS: BudgetCat[] = [
  { name: 'Housing',       budget: 25000, spent: 25000 },
  { name: 'Food & dining', budget: 12000, spent: 9800  },
  { name: 'Transport',     budget: 5000,  spent: 3200  },
  { name: 'Entertainment', budget: 5000,  spent: 6100  },
  { name: 'Health',        budget: 4000,  spent: 2800  },
  { name: 'Shopping',      budget: 8000,  spent: 5400  },
  { name: 'Utilities',     budget: 3000,  spent: 2800  },
  { name: 'Savings / SIP', budget: 16000, spent: 14400 },
]

/* ── Tax summary ─────────────────────────────────────────────── */
const TAX_ITEMS = [
  { label: '80C utilised',        value: '₹1,16,000', limit: '₹1,50,000', pct: 77  },
  { label: 'HRA exemption',       value: '₹2,16,000', limit: 'calculated', pct: 100 },
  { label: 'Standard deduction',  value: '₹75,000',   limit: '₹75,000',   pct: 100 },
]

function TaxBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'var(--color-pass)' : pct >= 50 ? 'var(--color-brand)' : 'var(--color-warn)'
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-1.5 rounded-full bg-brand-tint overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono text-ink w-9 text-right flex-shrink-0">{pct}%</span>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────── */
export default function PersonalData() {
  const [incomeExpanded, setIncomeExpanded] = useState(true)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="min-h-full px-5 py-5 pb-24 md:pb-8 flex flex-col gap-5">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-ink">Personal data</h1>
            <p className="text-xs text-secondary mt-0.5">FY 2025–26 · New tax regime</p>
          </div>
          <button className="px-3 py-1.5 text-sm text-secondary rounded-md hover:bg-brand-tint transition-colors border-thin">
            Edit profile
          </button>
        </div>

        {/* Top 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Profile */}
          <Section title="Profile" icon={IconUser}>
            <Row label="Full name"        value="Anurag Kandulna" />
            <Row label="Age"              value="28" />
            <Row label="City"             value="Bangalore, KA" />
            <Row label="Employment type"  value="Salaried (full-time)" />
            <Row label="Risk profile"     value="Moderate" />
            <Row label="Tax regime"       value="New regime · FY 2025-26" />
          </Section>

          {/* Income */}
          <Section title="Income details" icon={IconBriefcase}>
            <Row label="Monthly take-home" value="₹80,000"       mono />
            <Row label="Annual CTC"        value="₹14,40,000"    mono />
            <Row label="Employer"          value="TechCorp Pvt Ltd" />
            <Row label="Income sources"    value="Salary, Freelance" />
            <Row label="YTD earnings"      value="₹4,80,000"     mono />
            <Row label="Next credit date"  value="Jul 1, 2026" />
          </Section>

          {/* Financial goals */}
          <Section title="Financial goals" icon={IconTarget}>
            {GOALS.map(g => <GoalCard key={g.name} goal={g} />)}
          </Section>

          {/* Tax summary */}
          <Section title="Tax summary (India — FY 2025-26)" icon={IconReceipt}>
            <div className="flex flex-col gap-2.5">
              {TAX_ITEMS.map(t => (
                <div key={t.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">{t.label}</span>
                    <span className="text-xs font-mono text-ink">{t.value} <span className="text-secondary">/ {t.limit}</span></span>
                  </div>
                  <TaxBar pct={t.pct} />
                </div>
              ))}
              <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '0.5px solid var(--color-border)' }}>
                <span className="text-xs font-medium text-ink">Estimated tax liability</span>
                <span className="text-xs font-mono font-semibold text-ink">₹32,400</span>
              </div>
            </div>
          </Section>
        </div>

        {/* Salary credit log */}
        <Section title="Salary credit log" icon={IconCash}>
          <button
            className="flex items-center gap-1.5 text-xs text-secondary mb-3 hover:text-ink transition-colors"
            onClick={() => setIncomeExpanded(p => !p)}
          >
            {incomeExpanded ? <IconChevronUp size={12} stroke={2} /> : <IconChevronDown size={12} stroke={2} />}
            {incomeExpanded ? 'Collapse' : 'Expand'} · 6 months
          </button>

          {incomeExpanded && (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-xs border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {['Month', 'Expected', 'Credited', 'Amount', 'Source', 'Status'].map(h => (
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
                  {SALARY_LOG.map(row => (
                    <tr key={row.month} className="hover:bg-brand-tint transition-colors">
                      <td className="py-2 pr-4 text-ink font-medium">{row.month}</td>
                      <td className="py-2 pr-4 text-secondary font-mono">{row.expected}</td>
                      <td className="py-2 pr-4 font-mono text-ink">{row.credited}</td>
                      <td className="py-2 pr-4 font-mono text-ink">{row.amount}</td>
                      <td className="py-2 pr-4 text-secondary truncate max-w-[140px]">{row.source}</td>
                      <td className="py-2 pr-4">
                        <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_STYLE[row.status].cls}`} style={{ fontSize: 10 }}>
                          {STATUS_STYLE[row.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Category budget tracker */}
        <Section title="Monthly budget by category — Jun 2026" icon={IconTarget}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BUDGET_CATS.map(cat => {
              const pct      = Math.round((cat.spent / cat.budget) * 100)
              const over     = pct > 100
              const barColor = over ? 'var(--color-fail)' : pct > 85 ? 'var(--color-warn)' : 'var(--color-brand)'
              return (
                <div key={cat.name} className="bg-snow rounded-lg p-3 border-thin">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-ink truncate">{cat.name}</span>
                    {over && <IconAlertTriangle size={11} stroke={2} className="text-fail flex-shrink-0" />}
                    {!over && <IconCheck size={11} stroke={2.5} className="text-pass flex-shrink-0" />}
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-tint overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                    />
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

      <DisclaimerBar />
      <MobileBottomNav activeTab="personal" />
    </div>
  )
}
