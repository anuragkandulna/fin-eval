import { NavLink } from 'react-router-dom'
import { IconSun, IconMoon, IconMenu2 } from '@tabler/icons-react'
import { useTheme }   from '../contexts/ThemeContext'
import { useSidebar } from '../contexts/SidebarContext'

const navLinks = [
  { to: '/',          label: 'Dashboard', testid: 'nav-dashboard', end: true },
  { to: '/documents', label: 'Documents', testid: 'nav-documents', end: false },
  { to: '/reports',   label: 'Reports',   testid: 'nav-reports',   end: false },
]

export default function NavBar() {
  const { theme, toggle }         = useTheme()
  const { toggle: toggleSidebar } = useSidebar()

  return (
    <nav
      className="bg-card flex items-center px-4 h-14 gap-4 sticky top-0 z-40 flex-shrink-0"
      style={{ borderBottom: '0.5px solid var(--color-border)' }}
    >
      {/* Sidebar toggle — desktop only, ChatGPT-style */}
      <button
        data-testid="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle history sidebar"
        className="hidden md:flex w-9 h-9 items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-brand-tint transition-colors flex-shrink-0"
      >
        <IconMenu2 size={18} stroke={1.5} />
      </button>

      {/* Logo — sized to feel as heavy as the nav text */}
      <img
        src={theme === 'dark' ? '/fineval-dark.png' : '/fineval-light.png'}
        alt="FinEval"
        className="h-9 flex-shrink-0"
        style={{ width: 'auto' }}
      />

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-1 flex-1 ml-2">
        {navLinks.map(({ to, label, testid, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={testid}
            className={({ isActive }) =>
              `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'text-brand bg-brand-tint'
                  : 'text-secondary hover:text-ink hover:bg-brand-tint'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          data-testid="theme-toggle"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="w-9 h-9 flex items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
        >
          {theme === 'dark'
            ? <IconSun  size={17} stroke={1.5} />
            : <IconMoon size={17} stroke={1.5} />}
        </button>

        <div className="w-8 h-8 rounded-full bg-brand-tint text-brand text-xs font-semibold flex items-center justify-center select-none">
          AK
        </div>
      </div>
    </nav>
  )
}
