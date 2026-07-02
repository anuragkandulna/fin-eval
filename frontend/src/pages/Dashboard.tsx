import { useState } from 'react'
import BudgetHealthCards      from '../components/BudgetHealthCards'
import SpendVsIncomeChart     from '../components/SpendVsIncomeChart'
import CategoryDonut          from '../components/CategoryDonut'
import SpendingTrendChart     from '../components/SpendingTrendChart'
import TopSpendingCategories  from '../components/TopSpendingCategories'
import SpendingBreakdown      from '../components/SpendingBreakdown'
import Recommendations        from '../components/Recommendations'
import DisclaimerBar          from '../components/DisclaimerBar'
import MobileBottomNav        from '../components/MobileBottomNav'
import MobileChatSheet        from '../components/MobileChatSheet'

function DashboardContent() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 min-h-0">

      {/* Row 1 — health metrics */}
      <div>
        <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
          Budget health
        </p>
        <BudgetHealthCards />
      </div>

      {/* Row 2 — left: AI recommendations (sticky), right: charts */}
      <div className="flex gap-4 min-h-0 items-start">

        {/* Left column — recommendations (desktop only) */}
        <div className="hidden lg:block w-72 flex-shrink-0 sticky top-0 self-start">
          <Recommendations />
        </div>

        {/* Right column — charts */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-card rounded-lg border-thin p-4">
            <p className="text-sm font-semibold text-ink mb-3">Monthly spend vs income</p>
            <SpendVsIncomeChart />
          </div>

          <div className="bg-card rounded-lg border-thin p-4">
            <p className="text-sm font-semibold text-ink mb-3">Spending trend — last 6 months</p>
            <SpendingTrendChart />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoryDonut />
            <TopSpendingCategories />
          </div>

          <div className="bg-card rounded-lg border-thin p-4">
            <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
            <SpendingBreakdown />
          </div>
        </div>
      </div>

      {/* Recommendations below charts on narrow screens */}
      <div className="lg:hidden">
        <Recommendations />
      </div>

    </div>
  )
}

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">

      {/* Desktop */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden min-h-0">
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <DashboardContent />
          <DisclaimerBar />
        </main>
      </div>

      {/* Mobile — dashboard always visible, sheet slides over it */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden min-h-0">
        <DashboardContent />
        <DisclaimerBar />
      </div>

      <MobileBottomNav
        activeTab={chatOpen ? 'chat' : 'dashboard'}
        onDashboardClick={() => setChatOpen(false)}
        onChatClick={() => setChatOpen(true)}
      />

      {/* Mobile bottom sheet — slides up over dashboard content */}
      <MobileChatSheet open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
