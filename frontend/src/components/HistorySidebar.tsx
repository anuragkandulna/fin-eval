import { IconAdjustmentsHorizontal, IconBell, IconChevronRight, IconFolders, IconPlus, IconSettings, IconStar, IconUserCircle } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useSidebar } from '../contexts/SidebarContext'

const QUICK_ACTIONS = [
  { id: 'workspace-new', label: 'New analysis', icon: IconPlus, to: '/' },
  { id: 'workspace-docs', label: 'Knowledge base', icon: IconFolders, to: '/documents' },
  { id: 'workspace-saved', label: 'Saved views', icon: IconStar, to: '/reports' },
]

const SETTINGS = [
  { id: 'workspace-profile', label: 'Profile & preferences', icon: IconUserCircle },
  { id: 'workspace-alerts', label: 'Alerts & thresholds', icon: IconBell },
  { id: 'workspace-config', label: 'Agent configuration', icon: IconAdjustmentsHorizontal },
  { id: 'workspace-settings', label: 'Workspace settings', icon: IconSettings },
]

export default function HistorySidebar() {
  const { close } = useSidebar()
  const navigate = useNavigate()

  return (
    <aside className="w-64 h-full flex flex-col bg-card drawer-surface">
      <div className="px-4 pt-4 pb-3 separator-soft-b">
        <p
          className="text-secondary font-medium uppercase"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Workspace
        </p>
        <p className="text-sm text-ink font-semibold mt-1">FinEval command center</p>
        <p className="text-xs text-secondary mt-1">
          Keep navigation, future controls, and user preferences here while recent chats live inside the advisor.
        </p>
      </div>

      <div className="px-3 py-3 separator-soft-b">
        <div className="flex flex-col gap-1.5">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                data-testid={action.id}
                onClick={() => {
                  navigate(action.to)
                  close()
                }}
                className="w-full rounded-xl px-3 py-2.5 text-left bg-snow hover:bg-brand-tint transition-colors border-thin"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-tint flex items-center justify-center flex-shrink-0">
                    <Icon size={16} stroke={1.7} className="text-brand" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{action.label}</p>
                    <p className="text-[11px] text-secondary">Open and continue where you left off</p>
                  </div>
                  <IconChevronRight size={14} stroke={1.6} className="text-secondary flex-shrink-0" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p
          className="text-secondary font-medium uppercase mb-2"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Future-ready controls
        </p>
        <div className="flex flex-col gap-1.5">
          {SETTINGS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                data-testid={item.id}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-brand-tint transition-colors"
              >
                <Icon size={15} stroke={1.6} className="text-secondary flex-shrink-0" />
                <span className="text-sm text-ink">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-3 separator-soft-t">
        <div className="rounded-xl bg-snow border-thin px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Anurag Kandulna</p>
              <p className="text-xs text-secondary">Workspace owner</p>
            </div>
            <span className="w-9 h-9 rounded-full bg-brand-tint text-brand text-xs font-semibold flex items-center justify-center">
              AK
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
