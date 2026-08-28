import { createContext, useContext, useState, ReactNode } from 'react'

export type ChatState = 'collapsed' | 'docked'

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
  { id: '1', role: 'assistant', text: 'Hi John. Health score is 74 — good, but savings rate is just below target. Want to close the gap?' },
  { id: '2', role: 'user',      text: 'Why is my savings rate only 18%?' },
  { id: '3', role: 'assistant', text: 'Your wants at 24% is eating into savings. Cut ₹2,000/month there to hit 20%.' },
  { id: '4', role: 'user',      text: 'How much tax will I owe this year?' },
  { id: '5', role: 'assistant', text: 'Under the new regime: ₹14.4L CTC minus ₹75k standard deduction = ₹13.65L taxable. Tax + 4% cess ≈ ₹91,666. Q2 advance tax of ₹22,900 is due by Sep 15.' },
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
