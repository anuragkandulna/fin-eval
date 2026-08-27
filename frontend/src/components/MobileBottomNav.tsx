import { useNavigate, useLocation } from 'react-router-dom'
import { IconFileText, IconLayoutDashboard, IconMessage, IconUserCircle } from '@tabler/icons-react'

interface Props {
  onChatClick: () => void
}

export default function MobileBottomNav({ onChatClick }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', Icon: IconLayoutDashboard, onClick: () => navigate('/'),           path: '/'         },
    { id: 'chat',      label: 'Chat',      Icon: IconMessage,          onClick: onChatClick,                   path: null        },
    { id: 'docs',      label: 'Docs',      Icon: IconFileText,         onClick: () => navigate('/documents'), path: '/documents' },
    { id: 'personal',  label: 'Personal',  Icon: IconUserCircle,       onClick: () => navigate('/personal'),  path: '/personal'  },
  ]

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="md:hidden flex items-center bg-card flex-shrink-0"
      style={{ borderTop: '0.5px solid var(--color-border)' }}
    >
      {tabs.map(({ id, label, Icon, onClick, path }) => {
        const isActive = path !== null && pathname === path
        return (
          <button
            key={id}
            data-testid={`mobile-nav-${id}`}
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? 'text-brand' : 'text-secondary'
            }`}
          >
            <Icon size={20} stroke={isActive ? 2 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
