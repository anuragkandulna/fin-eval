import { NavLink } from 'react-router-dom'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { useTheme } from '../contexts/ThemeContext'

const navLinks = [
  { to: '/',          label: 'Dashboard', testid: 'nav-dashboard', end: true },
  { to: '/documents', label: 'Documents', testid: 'nav-documents', end: false },
  { to: '/reports',   label: 'Reports',   testid: 'nav-reports',   end: false },
]

export default function NavBar() {
  const { theme, toggle } = useTheme()

  return (
    <nav
      className="bg-card flex items-center px-6 h-12 gap-8 sticky top-0 z-40 flex-shrink-0"
      style={{ borderBottom: '0.5px solid var(--color-border)' }}
    >
      <img
        src={theme === 'dark' ? '/fineval-dark.png' : '/fineval-light.png'}
        alt="FinEval"
        className="h-6 flex-shrink-0"
      />

      <div className="hidden md:flex items-center gap-6 flex-1">
        {navLinks.map(({ to, label, testid, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={testid}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors pb-0.5 ${
                isActive
                  ? 'text-brand border-b-2 border-brand'
                  : 'text-secondary hover:text-ink'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          data-testid="theme-toggle"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
        >
          {theme === 'dark' ? <IconSun size={16} stroke={1.5} /> : <IconMoon size={16} stroke={1.5} />}
        </button>

        <div className="w-8 h-8 rounded-full bg-brand-tint text-brand text-xs font-semibold flex items-center justify-center select-none">
          AK
        </div>
      </div>
    </nav>
  )
}
