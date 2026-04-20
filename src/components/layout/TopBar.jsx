import { useAuth } from '../../hooks/useAuth.js'
import { useDarkMode } from '../../hooks/useDarkMode.js'

export default function TopBar() {
  const { user, role, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()

  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-notion-border dark:bg-notion-bg/80">
      <div className="md:hidden flex items-center gap-2">
        <span className="text-lg">🎓</span>
        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-notion-text">
          Smart Calendar
        </span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="btn-ghost text-lg p-2"
          aria-label="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        {user && (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-slate-600 dark:text-notion-muted">
                {user.displayName || user.email}
              </span>
              {role && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {role}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="btn-ghost text-xs"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  )
}

