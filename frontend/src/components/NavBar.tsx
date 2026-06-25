import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Chat',      testid: 'nav-chat' },
  { to: '/analyse',   label: 'Analyse',   testid: 'nav-analyse' },
  { to: '/documents', label: 'Documents', testid: 'nav-documents' },
]

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
      <span className="font-semibold text-gray-900 text-lg tracking-tight">
        FinEval
      </span>
      <div className="flex gap-6">
        {links.map(({ to, label, testid }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            data-testid={testid}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
