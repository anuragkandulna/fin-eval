import { createContext, useContext, useState, ReactNode } from 'react'

export type ChatState = 'collapsed' | 'floating' | 'docked'

export interface ChatMessage {
  id:   string
  role: 'user' | 'assistant'
  text: string
}

interface ChatContextType {
  chatState:    ChatState
  setChatState: (s: ChatState) => void
  messages:     ChatMessage[]
  setMessages:  React.Dispatch<React.SetStateAction<ChatMessage[]>>
  unread:       number
  clearUnread:  () => void
}

const INITIAL: ChatMessage[] = [
  { id: '1', role: 'assistant', text: 'Hi Anurag. Health score is 74 — good, but savings rate is just below target. Want to close the gap?' },
  { id: '2', role: 'user',      text: 'Why is my savings rate only 18%?' },
  { id: '3', role: 'assistant', text: 'Your wants at 24% is eating into savings. Cut ₹2,000/month there to hit 20%.' },
  { id: '4', role: 'user',      text: 'What about my 80C headroom?' },
  { id: '5', role: 'assistant', text: '₹34,000 of 80C unused. An ELSS top-up before March 31 would use it efficiently.' },
]

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatState, setChatStateRaw] = useState<ChatState>('collapsed')
  const [messages,  setMessages]     = useState<ChatMessage[]>(INITIAL)
  const [unread,    setUnread]       = useState(1)

  const setChatState = (s: ChatState) => {
    if (s !== 'collapsed') setUnread(0)
    setChatStateRaw(s)
  }

  return (
    <ChatContext.Provider value={{ chatState, setChatState, messages, setMessages, unread, clearUnread: () => setUnread(0) }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be within ChatProvider')
  return ctx
}
