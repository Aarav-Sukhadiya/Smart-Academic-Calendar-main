import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function Sidebar() {
  const { role } = useAuth()

  const commonItems = [
    { to: '/dashboard', label: 'Calendar', icon: '📅' },
  ]

  const adminItems = [
    { to: '/admin', label: 'Manage Events', icon: '⚙️' },
  ]

  const items = role === 'admin'
    ? [...commonItems, ...adminItems]
    : commonItems

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200/80 bg-white md:flex md:flex-col dark:border-notion-border dark:bg-notion-sidebar">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-notion-text">
              Smart Calendar
            </div>
            <div className="text-[11px] text-slate-500 dark:text-notion-muted">
              Academic Planner
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 shadow-sm dark:from-indigo-500/20 dark:to-purple-500/20 dark:text-indigo-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-notion-muted dark:hover:bg-notion-hover dark:hover:text-notion-text'
              }`
            }
          >
            <span className="text-lg">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200/80 p-3 dark:border-notion-border">
        <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {role === 'admin' ? '🛡️ Admin' : '🎒 Student'}
          </div>
        </div>
      </div>
    </aside>
  )
}
