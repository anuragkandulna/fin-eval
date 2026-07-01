import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider }  from './contexts/ThemeContext'
import { SidebarProvider } from './contexts/SidebarContext'
import NavBar    from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Reports   from './pages/Reports'

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <BrowserRouter>
          {/* h-screen + overflow-hidden: all children size relative to viewport */}
          <div className="flex flex-col h-screen overflow-hidden bg-snow text-ink">
            <NavBar />
            {/* flex-1 min-h-0 ensures this shrinks correctly in Safari/Firefox */}
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
          </div>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}
