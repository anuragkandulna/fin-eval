import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconEdit, IconSend, IconMinus, IconMaximize, IconMinimize, IconX, IconPlus } from '@tabler/icons-react'
import { useChat, type ChatMessage } from '../contexts/ChatContext'

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

const CHAT_SESSIONS: { id: string; title: string; timestamp: string; seed: ChatMessage[] }[] = [
  {
    id: 'budget-review',
    title: 'Budget review June',
    timestamp: '2h ago',
    seed: [
      { id: 'b1', role: 'assistant', text: 'Hi Anurag. Health score is 74 — good, but savings rate is just below target. Want to close the gap?' },
      { id: 'b2', role: 'user', text: 'Why is my savings rate only 18%?' },
      { id: 'b3', role: 'assistant', text: 'Your wants at 24% is eating into savings. Cut ₹2,000/month there to hit 20%.' },
    ],
  },
  {
    id: 'tax-headroom',
    title: 'Section 80C deductions',
    timestamp: '3 weeks ago',
    seed: [
      { id: 't1', role: 'user', text: 'What about my 80C headroom?' },
      { id: 't2', role: 'assistant', text: '₹34,000 of 80C remains. An ELSS top-up before March 31 would use it efficiently.' },
    ],
  },
  {
    id: 'debt-plan',
    title: 'Credit card payoff plan',
    timestamp: 'Yesterday',
    seed: [
      { id: 'd1', role: 'user', text: 'How fast can I clear my credit card?' },
      { id: 'd2', role: 'assistant', text: 'At your current EMI pace, you clear it in about 8 months. A ₹3,000 top-up would shorten that by roughly 6 weeks.' },
    ],
  },
]

async function mockSend(message: string): Promise<string> {
  await new Promise(r => setTimeout(r, 800))
  return `Backend not connected yet. You asked: "${message}". See docs/api-endpoints.md for the /chat endpoint spec.`
}

export default function ChatPanel({ onMinimize, onDock, onUndock, onClose, compact }: Props) {
  const { messages, setMessages } = useChat()
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>('budget-review')
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
    setActiveSessionId(null)
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

  const newChat = () => {
    setActiveSessionId(null)
    setMessages([])
  }

  const openSession = (sessionId: string) => {
    const session = CHAT_SESSIONS.find(item => item.id === sessionId)
    if (!session) return
    setActiveSessionId(sessionId)
    setMessages(session.seed.map(message => ({ ...message })))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Auto-resize textarea up to 4 rows
  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
  }

  const headerH = compact ? 'py-2.5' : 'py-3'

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">

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
            data-testid="chat-new-session"
            onClick={newChat}
            title="New chat"
            className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
          >
            <IconPlus size={14} stroke={1.5} />
          </button>
          {onDock && (
            <button
              data-testid="chat-dock-button"
              title="Dock to panel"
              onClick={onDock}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconMaximize size={14} stroke={1.5} />
            </button>
          )}
          {onUndock && (
            <button
              data-testid="chat-undock-button"
              title="Undock"
              onClick={onUndock}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconMinimize size={14} stroke={1.5} />
            </button>
          )}
          {onMinimize && (
            <button
              data-testid="chat-minimize-button"
              title="Minimise"
              onClick={onMinimize}
              className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
            >
              <IconMinus size={14} stroke={1.5} />
            </button>
          )}
          {onClose && (
            <button
              data-testid="chat-close-button"
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

      <div
        className="px-4 py-3 flex-shrink-0 separator-soft-b"
        style={{ background: 'linear-gradient(180deg, var(--color-card), var(--color-snow))' }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-secondary">
            Recent sessions
          </span>
          <span className="text-[10px] font-mono text-secondary">{CHAT_SESSIONS.length} saved</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CHAT_SESSIONS.map(session => (
            <button
              key={session.id}
              data-testid={`chat-session-${session.id}`}
              onClick={() => openSession(session.id)}
              className={`min-w-[160px] rounded-xl px-3 py-2 text-left transition-colors ${
                activeSessionId === session.id ? 'bg-brand-tint border-accent' : 'bg-snow border-thin hover:bg-brand-tint'
              }`}
            >
              <p className="text-xs font-medium text-ink truncate">{session.title}</p>
              <p className="text-[11px] text-secondary mt-0.5">{session.timestamp}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-busy={loading}
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-card"
      >
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
              {suggestions.map((s, idx) => (
                <button
                  key={s}
                  data-testid={`chat-suggestion-${idx}`}
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
                    style={{
                      background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-brand-tint) 92%, transparent), var(--color-card))',
                      border: '1px solid color-mix(in srgb, var(--color-brand) 22%, var(--color-border))',
                      boxShadow: '0 10px 24px -20px var(--pane-shadow)',
                    }}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-secondary mt-0.5 pl-0.5">
                    AI-generated — verify with a qualified advisor
                  </p>
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
          <textarea
            data-testid="chat-input"
            rows={1}
            value={input}
            onChange={onTextareaChange}
            onKeyDown={onKeyDown}
            placeholder="Ask about your finances…"
            aria-label="Message input. Press Enter to send, Shift+Enter for new line."
            disabled={loading}
            className="flex-1 text-sm bg-snow text-ink rounded-md px-3 py-2 outline-none placeholder:text-secondary resize-none overflow-hidden"
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
