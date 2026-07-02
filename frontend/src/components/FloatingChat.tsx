import { useTheme }  from '../contexts/ThemeContext'
import { useChat }   from '../contexts/ChatContext'
import ChatPanel     from './ChatPanel'

export default function FloatingChat() {
  const { theme }                     = useTheme()
  const { chatState, setChatState, unread } = useChat()

  if (chatState === 'docked') return null

  return (
    <>
      {/* Floating chat window */}
      {chatState === 'floating' && (
        <div
          className="hidden md:flex flex-col fixed z-[9998] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width:  360,
            height: 520,
            bottom: 84,
            right:  24,
            border: '0.5px solid var(--color-border)',
            background: 'var(--color-card)',
            animation: 'floatIn 200ms ease-out',
          }}
        >
          <ChatPanel
            compact
            onMinimize={() => setChatState('collapsed')}
            onDock={() => setChatState('docked')}
            onClose={() => setChatState('collapsed')}
          />
        </div>
      )}

      {/* Floating icon */}
      <button
        data-testid="chat-floating-btn"
        onClick={() => setChatState(chatState === 'collapsed' ? 'floating' : 'collapsed')}
        aria-label="Open finance advisor"
        className="hidden md:flex fixed items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-[9999]"
        style={{
          width:   48,
          height:  48,
          bottom:  24,
          right:   24,
          background: 'var(--color-brand)',
        }}
      >
        <img
          src={theme === 'dark' ? '/fineval-dark.png' : '/fineval-light.png'}
          alt="FinEval"
          style={{ width: 24, height: 24, objectFit: 'contain', filter: 'brightness(10)' }}
        />
        {unread > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-card animate-pulse"
          />
        )}
      </button>
    </>
  )
}
