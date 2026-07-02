import { useChat } from '../contexts/ChatContext'
import { IconMessageCircle2 } from '@tabler/icons-react'

export default function FloatingChat() {
  const { chatState, setChatState, unread } = useChat()

  // Only the icon is needed — clicking docks the panel directly
  if (chatState !== 'collapsed') return null

  return (
    <button
      data-testid="chat-floating-btn"
      type="button"
      onClick={() => setChatState('docked')}
      aria-label="Open finance advisor"
      className="hidden md:flex fixed bottom-6 right-6 z-[9999] items-center justify-center rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
      style={{
        width:      56,
        height:     56,
        background: 'linear-gradient(160deg, var(--color-brand), color-mix(in srgb, var(--color-brand) 72%, black))',
        border:     '1px solid color-mix(in srgb, var(--color-brand) 65%, white)',
      }}
    >
      <IconMessageCircle2 size={24} stroke={1.9} className="text-white" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-card animate-pulse" />
      )}
    </button>
  )
}
