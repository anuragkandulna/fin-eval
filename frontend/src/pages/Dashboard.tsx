import { useChat } from '../contexts/ChatContext'

import BudgetHealthCards      from '../components/BudgetHealthCards'
import SpendVsIncomeChart     from '../components/SpendVsIncomeChart'
import CategoryDonut          from '../components/CategoryDonut'
import SpendingTrendChart     from '../components/SpendingTrendChart'
import TopSpendingCategories  from '../components/TopSpendingCategories'
import SpendingBreakdown      from '../components/SpendingBreakdown'
import Recommendations        from '../components/Recommendations'

function DashboardContent() {
  const { chatState } = useChat()
  const chatDocked = chatState === 'docked'

  // When chat is docked it takes 360px, so we stack: Recommendations on top, Budget Health + Charts below.
  // When chat is not docked, side-by-side at md+: Budget Health left, Recommendations right (sticky).
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className={`px-5 py-5 gap-5 min-h-full ${chatDocked ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-start'}`}>

        {/* Recommendations — top when chat docked or mobile; right column otherwise */}
        <div className={`${chatDocked ? 'w-full' : 'w-full md:w-64 lg:w-72 flex-shrink-0 order-1 md:order-2 md:sticky md:top-5 md:self-start'}`}>
          <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
            Recommendations
          </p>
          <Recommendations />
        </div>

        {/* Budget Health + Charts — always below recommendations when docked; left column otherwise */}
        <div className={`flex flex-col gap-5 min-w-0 ${chatDocked ? 'w-full' : 'flex-1 order-2 md:order-1'}`}>

          <div>
            <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              Budget health
            </p>
            <BudgetHealthCards />
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-3">Monthly spend vs income</p>
              <SpendVsIncomeChart />
            </div>

            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-3">Spending trend — last 6 months</p>
              <SpendingTrendChart />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CategoryDonut />
              <TopSpendingCategories />
            </div>

            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
              <SpendingBreakdown />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <DashboardContent />
    </div>
  )
}
