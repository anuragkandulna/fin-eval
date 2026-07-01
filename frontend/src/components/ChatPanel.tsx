import { useState, useRef, useEffect } from 'react'
import { IconEdit, IconSend } from '@tabler/icons-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content:
      'Hi Anurag. Health score is 74 — good, but savings rate is just below target. Want to close the gap?',
  },
  { role: 'user',      content: 'Why is my savings rate only 18%?' },
  {
    role: 'assistant',
    content:
      'Your wants at 24% is eating into savings. Cut ₹2,000/month there to hit 20%.',
  },
  { role: 'user',      content: 'What about my 80C headroom?' },
  {
    role: 'assistant',
    content:
      '₹34,000 of 80C unused. An ELSS top-up before March 31 would use it efficiently.',
  },
]

// Stub: replace with real API call once backend is wired
async function mockSend(message: string): Promise<string> {
  await new Promise(r => setTimeout(r, 800))
  return `Backend not connected yet. You asked: "${message}". See docs/api-endpoints.md for the /chat endpoint spec.`
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const reply = await mockSend(text)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '0.5px solid var(--color-border)' }}
      >
        <span
          className="text-secondary font-medium uppercase"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Finance Advisor
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) =>
          msg.role === 'assistant' ? (
            <div key={i} data-testid="assistant-message" className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-brand font-medium mb-1">
                <IconEdit size={12} stroke={1.5} />
                FinEval
              </div>
              <div
                className="text-sm text-ink rounded-lg rounded-tl-sm px-3 py-2.5 leading-relaxed"
                style={{ background: 'var(--color-brand-tint)', border: '0.5px solid var(--color-grid)' }}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} data-testid="user-message" className="flex justify-end">
              <div className="max-w-[85%] bg-brand text-white text-sm rounded-lg rounded-tr-sm px-3 py-2.5 leading-relaxed">
                {msg.content}
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
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: '0.5px solid var(--color-border)' }}
      >
        <div className="flex gap-2 items-center">
          <input
            data-testid="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your finances…"
            className="flex-1 text-sm bg-snow text-ink rounded-md px-3 py-2 outline-none transition-colors placeholder:text-secondary"
            style={{ border: '0.5px solid var(--color-border)' }}
          />
          <button
            data-testid="send-button"
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center bg-brand text-white rounded-md disabled:opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
            aria-label="Send message"
          >
            <IconSend size={14} stroke={2} />
          </button>
        </div>

        <div className="flex justify-end mt-1.5 gap-2 text-[10px] text-secondary">
          <span className="font-mono">prompt v3</span>
          <span>·</span>
          <span className="text-pass font-medium">eval gate passed</span>
        </div>
      </div>
    </div>
  )
}
