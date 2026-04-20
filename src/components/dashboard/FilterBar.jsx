import React from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function FilterBar({
  batch, setBatch,
  group, setGroup,
  hideEnglishIII, setHideEnglishIII,
}) {
  const { isAdmin } = useAuth()
  
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-notion-border dark:bg-notion-sidebar/50 mb-5">
      
      {/* Batch Select (Admin sees full select, or it's view-only for student) */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500 dark:text-notion-muted">Batch</label>
        <select
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="rounded-md border-slate-200 bg-white py-1 pl-2 pr-8 text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-notion-border dark:bg-notion-bg dark:text-notion-text"
          disabled={!isAdmin} // Students locked to default batch
        >
          <option value="2029">2029</option>
          <option value="2030">2030</option>
        </select>
      </div>

      <div className="h-4 w-px bg-slate-300 dark:bg-notion-border hidden sm:block"></div>

      {/* Group Toggle */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500 dark:text-notion-muted">Group</label>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-notion-border dark:bg-notion-bg">
          {isAdmin && (
            <button
              onClick={() => setGroup('All')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                group === 'All'
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-notion-muted dark:hover:bg-notion-sidebar'
              }`}
            >
              All
            </button>
          )}
          {['A', 'B', 'C'].map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                group === g
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-notion-muted dark:hover:bg-notion-sidebar'
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-slate-300 dark:bg-notion-border hidden md:block"></div>

      {/* English III Opt-in (Students only, or for everyone) */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={!hideEnglishIII}
          onChange={(e) => setHideEnglishIII(!e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 transition focus:ring-indigo-500 dark:border-notion-border dark:bg-notion-bg"
        />
        <span className="text-xs font-semibold text-slate-600 dark:text-notion-text">
          Enrolled in English III
        </span>
      </label>

    </div>
  )
}
