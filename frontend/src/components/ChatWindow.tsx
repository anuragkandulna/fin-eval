import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../api/client'
import type { ChatResponse } from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  traceUrl?: string | null
}

let sessionCounter = 0
const SESSION_ID = `session-${++sessionCounter}-${Date.now()}`

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState<Record<number, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

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
      const res: ChatResponse = await sendChat({
        message: text,
        session_id: SESSION_ID,
        context_docs: [],
      })
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          sources: res.sources,
          traceUrl: res.trace_url,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-16">
            Ask a personal finance question to get started.
          </p>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div
              key={i}
              data-testid="user-message"
              className="flex justify-end"
            >
              <div className="max-w-xl bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} data-testid="assistant-message" className="flex flex-col gap-1">
              <div className="max-w-xl bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                {msg.content}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="max-w-xl pl-1">
                  <button
                    onClick={() =>
                      setSourcesOpen(prev => ({ ...prev, [i]: !prev[i] }))
                    }
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {sourcesOpen[i] ? '▲ Hide sources' : '▼ Sources'}
                  </button>
                  {sourcesOpen[i] && (
                    <ul className="mt-1 space-y-0.5">
                      {[...new Set(msg.sources)].map(src => (
                        <li key={src} className="text-xs text-gray-500">
                          📄 {src}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {msg.traceUrl && (
                <a
                  href={msg.traceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600 pl-1"
                >
                  View trace ↗
                </a>
              )}
            </div>
          )
        )}

        {loading && (
          <div data-testid="loading-indicator" className="flex gap-1 pl-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-gray-200 pt-4 flex gap-3">
        <input
          data-testid="chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about budgeting, saving, debt management…"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          data-testid="send-button"
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
