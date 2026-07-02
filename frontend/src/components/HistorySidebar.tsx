import { IconAdjustmentsHorizontal, IconBell, IconFolders, IconPlus, IconSettings, IconStar, IconUserCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useSidebar } from '../contexts/SidebarContext'

const QUICK_ACTIONS = [
  { id: 'workspace-new',  label: 'New analysis',  icon: IconPlus,    to: '/'          },
  { id: 'workspace-docs', label: 'Knowledge base', icon: IconFolders, to: '/documents' },
  { id: 'workspace-saved',label: 'Saved views',    icon: IconStar,    to: '/reports'   },
]

const SETTINGS = [
  { id: 'workspace-profile',  label: 'Profile & preferences',  icon: IconUserCircle             },
  { id: 'workspace-alerts',   label: 'Alerts & thresholds',    icon: IconBell                   },
  { id: 'workspace-config',   label: 'Agent configuration',    icon: IconAdjustmentsHorizontal  },
  { id: 'workspace-settings', label: 'Workspace settings',     icon: IconSettings               },
]

export default function HistorySidebar() {
  const { close } = useSidebar()
  const navigate  = useNavigate()

  return (
    <aside className="w-64 h-full flex flex-col bg-card drawer-surface">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 separator-soft-b">
        <p className="text-secondary font-medium uppercase" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
          Workspace
        </p>
        <p className="text-sm text-ink font-semibold mt-0.5">FinEval</p>
      </div>

      {/* Quick navigation */}
      <div className="px-3 py-3 separator-soft-b flex flex-col gap-1">
        {QUICK_ACTIONS.map(({ id, label, icon: Icon, to }) => (
          <button
            key={id}
            data-testid={id}
            onClick={() => { navigate(to); close() }}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-brand-tint transition-colors"
          >
            <Icon size={15} stroke={1.6} className="text-brand flex-shrink-0" />
            <span className="text-sm text-ink">{label}</span>
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {SETTINGS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            data-testid={id}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-brand-tint transition-colors"
          >
            <Icon size={15} stroke={1.6} className="text-secondary flex-shrink-0" />
            <span className="text-sm text-ink">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile — navigates to Personal Data */}
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
