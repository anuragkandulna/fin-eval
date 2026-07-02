import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider }   from './contexts/ThemeContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { useSidebar }      from './contexts/SidebarContext'
import NavBar        from './components/NavBar'
import HistorySidebar from './components/HistorySidebar'
import Dashboard     from './pages/Dashboard'
import Documents     from './pages/Documents'
import Reports       from './pages/Reports'

function GlobalSidebarOverlay() {
  const { open, close } = useSidebar()
  const location = useLocation()

  // Dashboard desktop manages its own inline sidebar; only overlay on other pages
  if (location.pathname === '/' || !open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        aria-label="Close sidebar"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative z-50 w-56 drawer-surface separator-soft-r">
        <HistorySidebar />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <BrowserRouter>
          <div className="flex flex-col h-screen overflow-hidden bg-snow text-ink">
            <NavBar />
            <div className="flex-1 flex flex-col min-h-0">
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/reports"   element={<Reports />} />
                <Route path="/analyse"   element={<Navigate to="/" replace />} />
                <Route path="/chat"      element={<Navigate to="/" replace />} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <GlobalSidebarOverlay />
          </div>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}
