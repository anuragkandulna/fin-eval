import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'

interface Session {
  id: string
  title: string
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

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col overflow-hidden bg-card"
      style={{ borderRight: '0.5px solid var(--color-border)' }}
    >
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span
          className="text-secondary font-medium uppercase"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          History
        </span>
        <button
          data-testid="new-session"
          className="flex items-center gap-0.5 text-xs text-brand hover:opacity-70 transition-opacity font-medium"
        >
          <IconPlus size={12} stroke={2} />
          New
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {MOCK_SESSIONS.map(session => (
          <button
            key={session.id}
            onClick={() => setActiveId(session.id)}
            className={`w-full text-left px-4 py-2.5 transition-colors ${
              activeId === session.id ? 'bg-brand-tint' : 'hover:bg-brand-tint'
            }`}
          >
            <p
              className="text-sm font-medium text-ink leading-tight truncate"
              style={{ opacity: activeId === session.id ? 1 : 0.85 }}
            >
              {session.title}
            </p>
            <p className="text-xs text-secondary mt-0.5">{session.timestamp}</p>
          </button>
        ))}
      </nav>
    </aside>
  )
}
