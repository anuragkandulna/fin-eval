import { useState } from 'react'
import { useSidebar }        from '../contexts/SidebarContext'
import HistorySidebar        from '../components/HistorySidebar'
import BudgetHealthCards     from '../components/BudgetHealthCards'
import SpendingTrendChart    from '../components/SpendingTrendChart'
import Recommendations       from '../components/Recommendations'
import SpendingBreakdown     from '../components/SpendingBreakdown'
import DisclaimerBar         from '../components/DisclaimerBar'
import ChatPanel             from '../components/ChatPanel'
import MobileBottomNav       from '../components/MobileBottomNav'

type MobileView = 'budget' | 'chat'

export default function Dashboard() {
  const { open: sidebarOpen } = useSidebar()
  const [mobileView, setMobileView] = useState<MobileView>('budget')

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">

      {/* ── Desktop layout (md+) ──────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">

        {/* Collapsible history sidebar */}
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            width: sidebarOpen ? 224 : 0,
            borderRight: sidebarOpen ? '0.5px solid var(--color-border)' : 'none',
          }}
        >
          <HistorySidebar />
        </div>

        {/* Main budget content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

            <div>
              <p
                className="text-secondary font-medium uppercase mb-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                Budget health
              </p>
              <BudgetHealthCards />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-card rounded-lg border-thin p-4 min-w-0">
                <p className="text-sm font-semibold text-ink mb-3">
                  Spending trend — last 6 months
                </p>
                <SpendingTrendChart />
              </div>
              <div className="w-60 flex-shrink-0">
                <Recommendations />
              </div>
            </div>

            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
              <SpendingBreakdown />
            </div>

          </div>

          <DisclaimerBar />
        </main>

        {/* Right: Chat panel — fixed comfortable width */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 320,
            borderLeft: '0.5px solid var(--color-border)',
          }}
        >
          <ChatPanel />
        </div>
      </div>

      {/* ── Mobile layout (<md) ──────────────────────────── */}
      <div className="md:hidden flex-1 relative overflow-hidden min-h-0">

        {/* Budget view — slides out left when chat is active */}
        <div
          className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
          style={{ transform: mobileView === 'budget' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div>
              <p
                className="text-secondary font-medium uppercase mb-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                Budget health
              </p>
              <BudgetHealthCards />
            </div>
            <Recommendations />
            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-3">Spending breakdown</p>
              <SpendingBreakdown />
            </div>
          </div>
          <DisclaimerBar />
        </div>

        {/* Chat view — slides in from right */}
        <div
          className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
          style={{ transform: mobileView === 'chat' ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <ChatPanel />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav
        activeTab={mobileView === 'chat' ? 'chat' : 'dashboard'}
        onDashboardClick={() => setMobileView('budget')}
        onChatClick={() => setMobileView('chat')}
      />
    </div>
  )
}
