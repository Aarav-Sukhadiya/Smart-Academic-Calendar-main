import { memo } from 'react'

const COLOR_MAP = {
  lecture: 'bg-indigo-500/90 border-indigo-600',
  exam: 'bg-rose-500/90 border-rose-600',
  assignment: 'bg-amber-500/90 border-amber-600',
  holiday: 'bg-teal-500/90 border-teal-600',
  personal: 'bg-emerald-500/90 border-emerald-600',
}

const ICON_MAP = {
  lecture: '📚',
  exam: '📝',
  assignment: '📋',
  holiday: '🎉',
  personal: '✏️',
}

function CustomEvent({ event }) {
  const colorClass = event.isAiGenerated
    ? 'bg-violet-500/90 border-violet-600'
    : COLOR_MAP[event.type] || COLOR_MAP.personal
  const icon = event.isAiGenerated ? '🤖' : ICON_MAP[event.type] || '📌'

  return (
    <div
      className={`flex items-center gap-1 rounded-md border-l-[3px] px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm ${colorClass}`}
      title={`${event.title}${event.description ? '\n' + event.description : ''}`}
    >
      <span className="shrink-0 text-xs">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="truncate font-bold">{event.title}</div>
        {(event.raw?.classroom || event.raw?.faculty) && (
          <div className="mt-0.5 truncate text-[9px] opacity-90 leading-tight">
            {[event.raw?.faculty, event.raw?.classroom].filter(Boolean).join(' • ')}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CustomEvent, (prev, next) => {
  const a = prev.event
  const b = next.event
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.type === b.type &&
    a.isAiGenerated === b.isAiGenerated &&
    a.description === b.description &&
    a.raw?.classroom === b.raw?.classroom &&
    a.raw?.faculty === b.raw?.faculty
  )
})
