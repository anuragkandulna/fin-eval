import { useState } from 'react'
import { useSidebar }         from '../contexts/SidebarContext'
import { useMediaQuery }      from '../hooks/useMediaQuery'
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

function BudgetScrollContent({ mobile, compactDesktop }: { mobile?: boolean; compactDesktop?: boolean }) {
  const px = mobile ? 'px-4' : 'px-5'
  const stacked = mobile || compactDesktop

  return (
    <div className={`flex-1 overflow-y-auto ${px} py-5 flex flex-col gap-5 min-h-0`}>

      {/* Health cards */}
      <div>
        <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
          Budget health
        </p>
        <BudgetHealthCards />
      </div>

      <div className={`grid gap-4 ${stacked ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_19rem]'}`}>
        <div className="flex flex-col gap-4 min-w-0">
          <div className="bg-card rounded-lg border-thin p-4 min-w-0">
            <p className="text-sm font-semibold text-ink mb-3">Monthly spend vs income</p>
            <SpendVsIncomeChart />
          </div>

          <div className="bg-card rounded-lg border-thin p-4 min-w-0">
            <p className="text-sm font-semibold text-ink mb-3">Spending trend — last 6 months</p>
            <SpendingTrendChart />
          </div>

          <div className="bg-card rounded-lg border-thin p-4">
            <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
            <SpendingBreakdown />
          </div>
        </div>

        <div className={`flex flex-col gap-4 min-w-0 ${stacked ? '' : 'xl:sticky xl:top-5 self-start'}`}>
          <Recommendations />
          <CategoryDonut />
          <TopSpendingCategories />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { open: sidebarOpen, close: closeSidebar } = useSidebar()
  const [mobileView, setMobileView] = useState<MobileView>('budget')
  const compactDesktop = useMediaQuery('(max-width: 1360px)')

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">

      {/* ── Desktop layout (md+) */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out separator-soft-r"
          style={{ width: sidebarOpen ? 256 : 0 }}
        >
          <HistorySidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <BudgetScrollContent compactDesktop={compactDesktop} />
          <DisclaimerBar />
        </main>
      </div>

      {/* ── Mobile layout (<md) — pure conditional render, no bleed */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden min-h-0">
        {mobileView === 'budget' ? (
          <>
            <BudgetScrollContent mobile compactDesktop />
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
