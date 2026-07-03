import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider }    from './contexts/ThemeContext'
import { SidebarProvider }  from './contexts/SidebarContext'
import { ChatProvider }     from './contexts/ChatContext'
import { useChat }          from './contexts/ChatContext'
import { useSidebar }       from './contexts/SidebarContext'
import { IconMessageCircle2 } from '@tabler/icons-react'
import NavBar          from './components/NavBar'
import HistorySidebar  from './components/HistorySidebar'
import FloatingChat    from './components/FloatingChat'
import ChatPanel       from './components/ChatPanel'
import MobileChatSheet from './components/MobileChatSheet'
import DisclaimerBar   from './components/DisclaimerBar'
import Dashboard        from './pages/Dashboard'
import Documents        from './pages/Documents'
import PersonalData     from './pages/PersonalData'
import Reports          from './pages/Reports'

function AppLayout() {
  const { chatState, setChatState } = useChat()
  const { open, close }             = useSidebar()
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const docked = chatState === 'docked'

  return (
    <div className="flex flex-col h-[100dvh] min-h-screen overflow-hidden bg-snow text-ink">
      <NavBar />

      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Sidebar — persistent on desktop, overlay on mobile */}
        <div
          className="hidden md:block flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out separator-soft-r"
          style={{ width: open ? 256 : 0 }}
        >
          <HistorySidebar />
        </div>

        {/* Page content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/personal"  element={<PersonalData />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Docked chat panel — desktop only */}
        {docked && (
          <div className="hidden md:flex w-[400px] flex-shrink-0 flex-col pane-divider">
            <ChatPanel onClose={() => setChatState('collapsed')} />
          </div>
        )}
      </div>

      <DisclaimerBar />

      {/* Mobile floating chat button — WhatsApp style, replaces bottom nav */}
      <button
        data-testid="mobile-chat-fab"
        onClick={() => setMobileChatOpen(true)}
        aria-label="Open finance advisor"
        className="md:hidden fixed bottom-6 right-6 z-[90] w-14 h-14 flex items-center justify-center rounded-full shadow-lg"
        style={{
          background: 'linear-gradient(160deg, var(--color-brand), color-mix(in srgb, var(--color-brand) 72%, black))',
          border: '1px solid color-mix(in srgb, var(--color-brand) 65%, white)',
        }}
      >
        <IconMessageCircle2 size={24} stroke={1.9} className="text-white" />
      </button>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative z-50 w-64 drawer-surface separator-soft-r">
            <HistorySidebar />
          </div>
        </div>
      )}

      {/* Mobile chat sheet — overlays all pages */}
      <MobileChatSheet open={mobileChatOpen} onClose={() => setMobileChatOpen(false)} />

      {/* Desktop floating chat icon */}
      <FloatingChat />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ChatProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ChatProvider>
      </SidebarProvider>
    </ThemeProvider>
  )
}
