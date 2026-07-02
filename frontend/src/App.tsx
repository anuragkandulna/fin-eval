import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider }    from './contexts/ThemeContext'
import { SidebarProvider }  from './contexts/SidebarContext'
import { ChatProvider }     from './contexts/ChatContext'
import { useChat }          from './contexts/ChatContext'
import { useSidebar }       from './contexts/SidebarContext'
import NavBar         from './components/NavBar'
import HistorySidebar from './components/HistorySidebar'
import FloatingChat   from './components/FloatingChat'
import ChatPanel      from './components/ChatPanel'
import Dashboard      from './pages/Dashboard'
import Documents      from './pages/Documents'
import PersonalData   from './pages/PersonalData'
import Reports        from './pages/Reports'

function GlobalSidebarOverlay() {
  const { open, close } = useSidebar()
  const location = useLocation()
  if (location.pathname === '/' || !open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <button aria-label="Close sidebar" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={close} />
      <div className="relative z-50 w-56 drawer-surface separator-soft-r">
        <HistorySidebar />
      </div>
    </div>
  )
}

function AppLayout() {
  const { chatState, setChatState } = useChat()
  const docked = chatState === 'docked'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-snow text-ink">
      <NavBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/personal"  element={<PersonalData />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/analyse"   element={<Navigate to="/" replace />} />
            <Route path="/chat"      element={<Navigate to="/" replace />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Docked chat panel — desktop only */}
        {docked && (
          <div className="hidden md:flex w-[360px] flex-shrink-0 flex-col separator-soft-l">
            <ChatPanel onUndock={() => setChatState('floating')} />
          </div>
        )}
      </div>

      <GlobalSidebarOverlay />
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
