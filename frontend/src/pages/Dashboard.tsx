import { useState } from 'react'
import HistorySidebar    from '../components/HistorySidebar'
import BudgetHealthCards from '../components/BudgetHealthCards'
import SpendingTrendChart from '../components/SpendingTrendChart'
import Recommendations   from '../components/Recommendations'
import SpendingBreakdown from '../components/SpendingBreakdown'
import StatusBar         from '../components/StatusBar'
import ChatPanel         from '../components/ChatPanel'
import MobileBottomNav   from '../components/MobileBottomNav'

type MobileView = 'budget' | 'chat'

export default function Dashboard() {
  const [mobileView, setMobileView] = useState<MobileView>('budget')

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
      <div className="flex flex-1 overflow-hidden">

        {/* Left: History sidebar — desktop only */}
        <div className="hidden md:block flex-shrink-0">
          <HistorySidebar />
        </div>

        {/* Center: Budget content */}
        <main
          className={`flex-1 flex flex-col overflow-hidden ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
            {/* Section label */}
            <div>
              <p
                className="text-secondary font-medium uppercase mb-3"
                style={{ fontSize: 11, letterSpacing: '0.08em' }}
              >
                Budget health
              </p>
              <BudgetHealthCards />
            </div>

            {/* Chart + Recommendations */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-card rounded-lg border-thin p-4">
                <p className="text-sm font-semibold text-ink mb-3">
                  Spending trend — last 6 months
                </p>
                <SpendingTrendChart />
              </div>
              <div className="md:w-56 lg:w-64">
                <Recommendations />
              </div>
            </div>

            {/* Spending breakdown */}
            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
              <SpendingBreakdown />
            </div>
          </div>

          <StatusBar />
        </main>

        {/* Right: Chat panel — desktop always visible, mobile switchable */}
        <div
          className={`md:w-72 flex-shrink-0 flex flex-col overflow-hidden ${
            mobileView === 'budget' ? 'hidden md:flex' : 'flex flex-1'
          }`}
          style={{ borderLeft: '0.5px solid var(--color-border)' }}
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
