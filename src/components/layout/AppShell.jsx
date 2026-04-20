import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

export default function AppShell() {
  const { role } = useAuth()

  const mobileItems = [
    { to: '/dashboard', label: 'Calendar', icon: '📅' },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 md:pb-0 dark:bg-notion-bg">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white/80 backdrop-blur-xl md:hidden dark:border-notion-border dark:bg-notion-sidebar/80"
          style={{ gridTemplateColumns: `repeat(${mobileItems.length}, 1fr)` }}
        >
          {mobileItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-notion-muted'
                }`
              }
            >
              <span className="text-lg">{it.icon}</span>
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
