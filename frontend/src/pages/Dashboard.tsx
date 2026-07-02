import { useState } from 'react'
import { useSidebar }         from '../contexts/SidebarContext'
import HistorySidebar         from '../components/HistorySidebar'
import BudgetHealthCards      from '../components/BudgetHealthCards'
import SpendVsIncomeChart     from '../components/SpendVsIncomeChart'
import CategoryDonut          from '../components/CategoryDonut'
import SpendingTrendChart     from '../components/SpendingTrendChart'
import TopSpendingCategories  from '../components/TopSpendingCategories'
import SpendingBreakdown      from '../components/SpendingBreakdown'
import Recommendations        from '../components/Recommendations'
import DisclaimerBar          from '../components/DisclaimerBar'
import ChatPanel              from '../components/ChatPanel'
import MobileBottomNav        from '../components/MobileBottomNav'

type MobileView = 'budget' | 'chat'

function BudgetScrollContent({ mobile }: { mobile?: boolean }) {
  const px = mobile ? 'px-4' : 'px-5'
  const col = mobile ? 'flex-col' : 'flex-row'
  return (
    <div className={`flex-1 overflow-y-auto ${px} py-5 flex flex-col gap-5 min-h-0`}>

      {/* Health cards */}
      <div>
        <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
          Budget health
        </p>
        <BudgetHealthCards />
      </div>

      {/* Spend vs Income + Category Donut */}
      <div className={`flex ${col} gap-4`}>
        <div className="flex-1 bg-card rounded-lg border-thin p-4 min-w-0">
          <p className="text-sm font-semibold text-ink mb-3">Monthly spend vs income</p>
          <SpendVsIncomeChart />
        </div>
        <div className={mobile ? '' : 'w-64 flex-shrink-0'}>
          <CategoryDonut />
        </div>
      </div>

      {/* Trend + Top categories */}
      <div className={`flex ${col} gap-4`}>
        <div className="flex-1 bg-card rounded-lg border-thin p-4 min-w-0">
          <p className="text-sm font-semibold text-ink mb-3">Spending trend — last 6 months</p>
          <SpendingTrendChart />
        </div>
        <div className={mobile ? '' : 'w-64 flex-shrink-0'}>
          <TopSpendingCategories />
        </div>
      </div>

      {/* Spending breakdown */}
      <div className="bg-card rounded-lg border-thin p-4">
        <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
        <SpendingBreakdown />
      </div>

      {/* Recommendations */}
      <Recommendations />
    </div>
  )
}

export default function Dashboard() {
  const { open: sidebarOpen, close: closeSidebar } = useSidebar()
  const [mobileView, setMobileView] = useState<MobileView>('budget')

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">

      {/* ── Desktop layout (md+) */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out separator-soft-r"
          style={{ width: sidebarOpen ? 224 : 0 }}
        >
          <HistorySidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <BudgetScrollContent />
          <DisclaimerBar />
        </main>
      </div>

      {/* ── Mobile layout (<md) — pure conditional render, no bleed */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden min-h-0">
        {mobileView === 'budget' ? (
          <>
            <BudgetScrollContent mobile />
            <DisclaimerBar />
          </>
        ) : (
          <ChatPanel />
        )}
      </div>

      <MobileBottomNav
        activeTab={mobileView === 'chat' ? 'chat' : 'dashboard'}
        onDashboardClick={() => setMobileView('budget')}
        onChatClick={() => setMobileView('chat')}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <button
            aria-label="Close history drawer"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          <div className="relative z-50 w-72 max-w-[82vw] drawer-surface separator-soft-r">
            <HistorySidebar />
          </div>
        </div>
      )}
    </div>
  )
}
