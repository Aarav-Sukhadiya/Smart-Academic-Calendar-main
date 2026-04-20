/**
 * Color-coded legend showing what each event color means.
 */
const legendItems = [
  { color: 'bg-indigo-500', label: 'Lecture', icon: '📚' },
  { color: 'bg-rose-500', label: 'Exam', icon: '📝' },
  { color: 'bg-amber-500', label: 'Assignment', icon: '📋' },
  { color: 'bg-teal-500', label: 'Holiday', icon: '🎉' },
  { color: 'bg-emerald-500', label: 'Personal', icon: '✏️' },
  { color: 'bg-violet-500', label: 'AI Generated', icon: '🤖' },
]

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-2.5 backdrop-blur-sm dark:border-notion-border dark:bg-notion-sidebar/80">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-notion-muted">
        Legend
      </span>
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-full ${item.color} shadow-sm`} />
          <span className="text-[11px] font-medium text-slate-600 dark:text-notion-muted">
            {item.icon} {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
