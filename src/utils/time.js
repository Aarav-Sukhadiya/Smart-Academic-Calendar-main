export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const DAY_START_MIN = 7 * 60 // 7:00
export const DAY_END_MIN = 22 * 60 // 22:00

export function toMinutes(hhmm) {
  if (!hhmm) return 0
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function fromMinutes(mins) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(mins)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTime12(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hh = ((h + 11) % 12) + 1
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`
}

export function nowMinutes(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes()
}

export function dayIndex(now = new Date()) {
  return now.getDay()
}

export function durationMinutes(ev) {
  return Math.max(0, toMinutes(ev.endTime) - toMinutes(ev.startTime))
}

export function isoDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isEventOnDay(ev, date) {
  if (ev.recurrence === 'once' || ev.date) {
    return ev.date === isoDate(date)
  }
  return ev.dayOfWeek === date.getDay()
}

export function humanDuration(mins) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function compareByStart(a, b) {
  const da = a.dayOfWeek ?? -1
  const db = b.dayOfWeek ?? -1
  if (da !== db) return da - db
  return toMinutes(a.startTime) - toMinutes(b.startTime)
}
