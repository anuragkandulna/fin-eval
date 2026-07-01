import { useNavigate, useLocation } from 'react-router-dom'
import { IconLayoutDashboard, IconMessage, IconFileText } from '@tabler/icons-react'

type Tab = 'dashboard' | 'chat' | 'docs'

interface Props {
  activeTab: Tab
  onDashboardClick?: () => void
  onChatClick?: () => void
}

export default function MobileBottomNav({ activeTab, onDashboardClick, onChatClick }: Props) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const tabs = [
    {
      id:      'dashboard' as Tab,
      label:   'Dashboard',
      Icon:    IconLayoutDashboard,
      onClick: () => {
        if (onDashboardClick) onDashboardClick()
        else if (location.pathname !== '/') navigate('/')
      },
    },
    {
      id:      'chat' as Tab,
      label:   'Chat',
      Icon:    IconMessage,
      onClick: () => {
        if (onChatClick) onChatClick()
        else navigate('/')
      },
    },
    {
      id:      'docs' as Tab,
      label:   'Docs',
      Icon:    IconFileText,
      onClick: () => navigate('/documents'),
    },
  ]

  return (
    <nav
      className="md:hidden flex items-center bg-card flex-shrink-0"
      style={{ borderTop: '0.5px solid var(--color-border)' }}
    >
      {tabs.map(({ id, label, Icon, onClick }) => {
        const isActive = activeTab === id
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
