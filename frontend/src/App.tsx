import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import Chat from './pages/Chat'
import Analyse from './pages/Analyse'
import Documents from './pages/Documents'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-3xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/"          element={<Chat />} />
            <Route path="/analyse"   element={<Analyse />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
