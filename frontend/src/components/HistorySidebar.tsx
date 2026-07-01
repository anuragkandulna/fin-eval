import { useState } from 'react'
import { IconPlus, IconChevronsLeft } from '@tabler/icons-react'
import { useSidebar } from '../contexts/SidebarContext'

interface Session {
  id:        string
  title:     string
  timestamp: string
}

const MOCK_SESSIONS: Session[] = [
  { id: '1', title: 'Budget review June',      timestamp: '2h ago' },
  { id: '2', title: 'Credit card payoff plan',  timestamp: 'Yesterday' },
  { id: '3', title: 'Emergency fund goal',      timestamp: '3 days ago' },
  { id: '4', title: 'SIP projection 10yr',      timestamp: 'Last week' },
  { id: '5', title: 'DTI ratio check',          timestamp: '2 weeks ago' },
  { id: '6', title: 'Section 80C deductions',   timestamp: '3 weeks ago' },
  { id: '7', title: 'NPS vs PPF comparison',    timestamp: '1 month ago' },
]

export default function HistorySidebar() {
  const [activeId, setActiveId] = useState('1')
  const { close } = useSidebar()

  return (
    <div className="w-56 h-full flex flex-col bg-card">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '0.5px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-secondary font-medium uppercase"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            History
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            data-testid="new-session"
            className="flex items-center gap-0.5 text-xs text-brand hover:opacity-70 transition-opacity font-medium px-1.5 py-1 rounded hover:bg-brand-tint"
          >
            <IconPlus size={12} stroke={2} /> New
          </button>
          {/* ChatGPT-style collapse button */}
          <button
            data-testid="sidebar-close"
            onClick={close}
            aria-label="Collapse sidebar"
            className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
          >
            <IconChevronsLeft size={15} stroke={1.5} />
          </button>
        </div>
      </div>

      {/* Session list */}
      <nav className="flex-1 overflow-y-auto py-1">
        {MOCK_SESSIONS.map(session => (
          <button
            key={session.id}
            onClick={() => setActiveId(session.id)}
            className={`w-full text-left px-3 py-2.5 rounded-md mx-1 transition-colors group ${
              activeId === session.id
                ? 'bg-brand-tint'
                : 'hover:bg-brand-tint'
            }`}
            style={{ width: 'calc(100% - 8px)' }}
          >
            <p className="text-sm font-medium text-ink leading-tight truncate">
              {session.title}
            </p>
            <p className="text-xs text-secondary mt-0.5">{session.timestamp}</p>
          </button>
        ))}
      </nav>
    </div>
  )
}
