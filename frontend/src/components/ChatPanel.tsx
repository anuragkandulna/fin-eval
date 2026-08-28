import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconEdit, IconSend, IconX, IconPlus, IconMessage, IconHistory } from '@tabler/icons-react'
import { useChat, type ChatMessage } from '../contexts/ChatContext'
import { sendChat } from '../api/client'

interface Props {
  onClose?: () => void
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
  '/personal':  ["When is my next salary credit?", "What's my tax liability this year?", "Am I hitting my savings goals?"],
  '/reports':   ["Give me a monthly summary", "What changed since last month?", "Where can I save more?"],
}

const CHAT_SESSIONS: { id: string; title: string; timestamp: string; preview: string; seed: ChatMessage[] }[] = [
  {
    id: 'budget-review',
    title: 'Budget review June',
    timestamp: '2h ago',
    preview: 'Your wants at 24% is eating into savings…',
    seed: [
      { id: 'b1', role: 'assistant', text: 'Hi Anurag. Health score is 74 — good, but savings rate is just below target. Want to close the gap?' },
      { id: 'b2', role: 'user',      text: 'Why is my savings rate only 18%?' },
      { id: 'b3', role: 'assistant', text: 'Your wants at 24% is eating into savings. Cut ₹2,000/month there to hit 20%.' },
    ],
  },
  {
    id: 'tax-summary',
    title: 'New regime tax liability',
    timestamp: '3 weeks ago',
    preview: 'Your estimated tax is ₹91,666 this year…',
    seed: [
      { id: 't1', role: 'user',      text: 'How much tax will I pay this year?' },
      { id: 't2', role: 'assistant', text: 'Under the new regime with your ₹14.4L CTC and ₹75,000 standard deduction, taxable income is ₹13.65L. Estimated tax including 4% cess: ₹91,666.' },
    ],
  },
  {
    id: 'debt-plan',
    title: 'Credit card payoff plan',
    timestamp: 'Yesterday',
    preview: 'At your current EMI pace, you clear it in 8 months…',
    seed: [
      { id: 'd1', role: 'user',      text: 'How fast can I clear my credit card?' },
      { id: 'd2', role: 'assistant', text: 'At your current EMI pace, you clear it in about 8 months. A ₹3,000 top-up would shorten that by roughly 6 weeks.' },
    ],
  },
]

let _sessionCounter = 0
const PANEL_SESSION_ID = `panel-${++_sessionCounter}-${Date.now()}`

type Tab = 'chat' | 'history'

export default function ChatPanel({ onClose }: Props) {
  const { messages, setMessages } = useChat()
  const [tab,       setTab]       = useState<Tab>('chat')
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [activeId,  setActiveId]  = useState<string | null>('budget-review')
  const bottomRef = useRef<HTMLDivElement>(null)
  const location  = useLocation()

  const pageName    = PAGE_CONTEXT[location.pathname] ?? 'Dashboard'
  const suggestions = PAGE_PROMPTS[location.pathname] ?? PAGE_PROMPTS['/']

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setActiveId(null)
    setTab('chat')
    setInput('')
    setMessages(prev => [...prev, { id: String(Date.now()), role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await sendChat({ message: msg, session_id: PANEL_SESSION_ID, context_docs: [] })
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: 'assistant', text: res.response }])
    } catch {
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: 'assistant', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const newChat = () => { setActiveId(null); setMessages([]) }

  const openSession = (id: string) => {
    const session = CHAT_SESSIONS.find(s => s.id === id)
    if (!session) return
    setActiveId(id)
    setMessages(session.seed.map(m => ({ ...m })))
    setTab('chat')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0 separator-soft-b">
        <IconEdit size={14} stroke={1.5} className="text-brand flex-shrink-0" />
        <span className="text-secondary font-medium uppercase flex-1" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
          Finance Advisor
        </span>
        <button
          data-testid="chat-new-session"
          onClick={newChat}
          title="New chat"
          className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
        >
          <IconPlus size={14} stroke={1.5} />
        </button>
        {onClose && (
          <button
            data-testid="chat-close-button"
            onClick={onClose}
            title="Close"
            className="w-7 h-7 flex items-center justify-center rounded text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
          >
            <IconX size={14} stroke={1.5} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0 separator-soft-b px-4 gap-1 pt-2">
        {([['chat', 'Chat', IconMessage], ['history', 'History', IconHistory]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            data-testid={`chat-tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors mb-0 border-b-2 ${
              tab === id
                ? 'text-brand border-brand bg-brand-tint'
                : 'text-secondary border-transparent hover:text-ink'
            }`}
          >
            <Icon size={12} stroke={1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Chat tab ── */}
      {tab === 'chat' && (
        <>
          {/* Context bar */}
          <div
            className="px-4 py-1.5 flex items-center gap-1.5 flex-shrink-0"
            style={{ background: 'var(--color-snow)', borderBottom: '0.5px solid var(--color-border)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            <span className="text-[11px] text-secondary">Looking at: <span className="text-ink font-medium">{pageName}</span></span>
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
        </>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0">
          {CHAT_SESSIONS.map(session => (
            <button
              key={session.id}
              data-testid={`chat-session-${session.id}`}
              onClick={() => openSession(session.id)}
              className={`w-full text-left rounded-xl px-4 py-3 transition-colors ${
                activeId === session.id
                  ? 'bg-brand-tint border-accent'
                  : 'bg-snow border-thin hover:bg-brand-tint'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-ink leading-tight">{session.title}</p>
                <span className="text-[11px] text-secondary flex-shrink-0">{session.timestamp}</span>
              </div>
              <p className="text-xs text-secondary leading-snug truncate">{session.preview}</p>
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
