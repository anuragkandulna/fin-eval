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

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatState, setChatStateRaw] = useState<ChatState>('collapsed')
  const [messages,  setMessages]     = useState<ChatMessage[]>([])
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
