import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import NavBar    from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Reports   from './pages/Reports'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-snow text-ink">
          <NavBar />
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/reports"   element={<Reports />} />
            {/* Legacy routes — redirect to home */}
            <Route path="/analyse"   element={<Navigate to="/" replace />} />
            <Route path="/chat"      element={<Navigate to="/" replace />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
