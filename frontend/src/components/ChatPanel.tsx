import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconEdit, IconSend, IconMinus, IconMaximize, IconMinimize, IconX, IconPlus } from '@tabler/icons-react'
import { useChat } from '../contexts/ChatContext'

interface Props {
  /** show minimize → collapsed */
  onMinimize?: () => void
  /** show dock icon → docked */
  onDock?: () => void
  /** show undock icon → floating */
  onUndock?: () => void
  /** show close/X → collapsed */
  onClose?: () => void
  /** smaller header for floating window */
  compact?: boolean
}

const PAGE_CONTEXT: Record<string, string> = {
  '/':          'Dashboard',
  '/documents': 'Documents',
  '/personal':  'Personal data',
  '/reports':   'Reports',
}

const PAGE_PROMPTS: Record<string, string[]> = {
  '/':          ["Why is my health score 74?", "What's my biggest expense this month?", "Am I on track for savings?"],
  '/documents': ["Summarise this document", "What are my total deductions this year?", "Which documents are missing?"],
  '/personal':  ["When is my next salary credit?", "Show me overdue invoices", "How much 80C headroom left?"],
  '/reports':   ["Give me a monthly summary", "What changed since last month?", "Where can I save more?"],
}

async function mockSend(message: string): Promise<string> {
  await new Promise(r => setTimeout(r, 800))
  return `Backend not connected yet. You asked: "${message}". See docs/api-endpoints.md for the /chat endpoint spec.`
}

export default function ChatPanel({ onMinimize, onDock, onUndock, onClose, compact }: Props) {
  const { messages, setMessages } = useChat()
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const location  = useLocation()

  const pageName    = PAGE_CONTEXT[location.pathname] ?? 'Dashboard'
  const suggestions = PAGE_PROMPTS[location.pathname] ?? PAGE_PROMPTS['/']
  const showHeader  = !!(onMinimize || onDock || onUndock || onClose)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: String(Date.now()), role: 'user', text: msg }])
    setLoading(true)
    try {
      const reply = await mockSend(msg)
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: 'assistant', text: reply }])
    } finally {
      setLoading(false)
    }
  }

  const newChat = () => setMessages([])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const headerH = compact ? 'py-2.5' : 'py-3'

  return (
    <div className="flex flex-col h-full bg-card">

      {/* Header */}
      <div className={`px-4 ${headerH} flex items-center gap-2 flex-shrink-0 separator-soft-b`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <IconEdit size={14} stroke={1.5} className="text-brand flex-shrink-0" />
          <span
            className="text-secondary font-medium uppercase truncate"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            Finance Advisor
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={newChat}
            title="New chat"
            className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
          >
            <IconPlus size={14} stroke={1.5} />
          </button>
          {onDock && (
            <button
              title="Dock to panel"
              onClick={onDock}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconMaximize size={14} stroke={1.5} />
            </button>
          )}
          {onUndock && (
            <button
              title="Undock"
              onClick={onUndock}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconMinimize size={14} stroke={1.5} />
            </button>
          )}
          {onMinimize && (
            <button
              title="Minimise"
              onClick={onMinimize}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconMinus size={14} stroke={1.5} />
            </button>
          )}
          {onClose && (
            <button
              title="Close"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconX size={14} stroke={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Context bar */}
      {showHeader && (
        <div
          className="px-4 py-1.5 flex items-center gap-1.5 flex-shrink-0"
          style={{ background: 'var(--color-snow)', borderBottom: '0.5px solid var(--color-border)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
          <span className="text-[11px] text-secondary">Looking at: <span className="text-ink font-medium">{pageName}</span></span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-brand-tint flex items-center justify-center">
              <IconEdit size={18} stroke={1.5} className="text-brand" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink mb-0.5">Finance Advisor</p>
              <p className="text-xs text-secondary">Ask anything about your finances</p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs text-ink bg-snow rounded-lg px-3 py-2 hover:bg-brand-tint transition-colors border-thin leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) =>
              msg.role === 'assistant' ? (
                <div key={msg.id} data-testid="assistant-message" className="flex flex-col gap-1">
                  {(i === 0 || messages[i - 1].role === 'user') && (
                    <div className="flex items-center gap-1.5 text-xs text-brand font-medium mb-1">
                      <IconEdit size={12} stroke={1.5} />
                      FinEval
                    </div>
                  )}
                  <div
                    className="text-sm text-ink rounded-lg rounded-tl-sm px-3 py-2.5 leading-relaxed"
                    style={{ background: 'var(--color-brand-tint)', border: '0.5px solid var(--color-grid)' }}
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} data-testid="user-message" className="flex justify-end">
                  <div className="max-w-[85%] bg-brand text-white text-sm rounded-lg rounded-tr-sm px-3 py-2.5 leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div data-testid="loading-indicator" className="flex gap-1 pl-1">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex-shrink-0 separator-soft-t">
        <div className="flex gap-2 items-center">
          <input
            data-testid="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your finances…"
            className="flex-1 text-sm bg-snow text-ink rounded-md px-3 py-2 outline-none placeholder:text-secondary"
            style={{ border: '0.5px solid var(--color-border)' }}
          />
          <button
            data-testid="send-button"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center bg-brand text-white rounded-md disabled:opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
            aria-label="Send"
          >
            <IconSend size={14} stroke={2} />
          </button>
        </div>
        <div className="flex justify-end mt-1.5">
          <span className="text-[10px] text-secondary font-mono">prompt v3</span>
        </div>
      </div>
    </div>
  )
}
