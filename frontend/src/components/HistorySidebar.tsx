import { IconExternalLink, IconFolders, IconLayoutDashboard, IconUserCircle } from '@tabler/icons-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSidebar } from '../contexts/SidebarContext'

const NAV = [
  { to: '/',          label: 'Dashboard', Icon: IconLayoutDashboard, end: true  },
  { to: '/documents', label: 'Documents', Icon: IconFolders,         end: false },
  { to: '/personal',  label: 'Personal',  Icon: IconUserCircle,      end: false },
]

const PORTALS = [
  { id: 'test-portal', label: 'Test portal',      url: import.meta.env.VITE_TEST_PORTAL_URL ?? '/reports' },
  { id: 'dev-portal',  label: 'Developer portal', url: import.meta.env.VITE_DEV_PORTAL_URL  ?? '/reports' },
]

export default function HistorySidebar() {
  const { close } = useSidebar()
  const navigate  = useNavigate()

  return (
    <aside className="w-64 h-full flex flex-col bg-card drawer-surface">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 separator-soft-b">
        <p className="text-secondary font-medium uppercase" style={{ fontSize: 11, letterSpacing: '0.08em' }}>Workspace</p>
        <p className="text-sm text-ink font-semibold mt-0.5">FinEval</p>
      </div>

      {/* Navigation — mobile only (desktop uses top navbar) */}
      <nav className="md:hidden px-3 py-3 flex flex-col gap-1 separator-soft-b">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={close}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'text-brand bg-brand-tint font-medium' : 'text-ink hover:bg-brand-tint'
              }`
            }
          >
            <Icon size={15} stroke={1.6} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Portals — mobile only (hidden on desktop where they're in the navbar) */}
      <div className="md:hidden px-3 py-3 flex flex-col gap-1 separator-soft-b">
        <p className="text-secondary font-medium uppercase px-3 mb-1" style={{ fontSize: 10, letterSpacing: '0.08em' }}>Portals</p>
        {PORTALS.map(({ id, label, url }) => (
          <button
            key={id}
            data-testid={id}
            onClick={() => { window.open(url, '_blank', 'noopener,noreferrer'); close() }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-tint transition-colors"
          >
            <IconExternalLink size={15} stroke={1.6} className="text-secondary flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Profile → Personal Data */}
      <div className="px-4 py-3 separator-soft-t">
        <button
          data-testid="workspace-profile-nav"
          onClick={() => { navigate('/personal'); close() }}
          className="w-full flex items-center gap-2.5 rounded-lg hover:bg-brand-tint transition-colors p-1 -m-1"
        >
          <span className="w-8 h-8 rounded-full bg-brand-tint text-brand text-xs font-semibold flex items-center justify-center flex-shrink-0">
            AK
          </span>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-ink truncate">Anurag Kandulna</p>
            <p className="text-xs text-secondary">Workspace owner</p>
          </div>
        </button>
      </div>

    </aside>
  )
}
