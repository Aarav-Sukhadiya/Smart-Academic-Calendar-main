import { createContext, useContext, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useCollegeEvents } from '../hooks/useCollegeEvents.js'
import { useStudentEvents } from '../hooks/useStudentEvents.js'

const CalendarContext = createContext(null)

/**
 * Normalizes a raw Firestore event into react-big-calendar format.
 * Each event gets: { id, title, start, end, source, type, ... }
 */
function normalizeEvent(ev, source) {
  const date = ev.date || new Date().toISOString().split('T')[0]
  const startTime = ev.startTime || '09:00'
  const endTime = ev.endTime || '10:00'

  const start = new Date(`${date}T${startTime}:00`)
  const end = new Date(`${date}T${endTime}:00`)

  return {
    id: ev.id,
    title: ev.title || 'Untitled',
    start,
    end,
    allDay: false,
    source, // 'college' | 'student'
    type: ev.type || (source === 'college' ? 'lecture' : 'personal'),
    description: ev.description || '',
    isAiGenerated: ev.isAiGenerated || false,
    raw: ev, // keep original data for editing
  }
}

export function CalendarProvider({ children }) {
  const { user, isAdmin } = useAuth()
  const { events: rawCollege, loading: loadingC, error: errorC } = useCollegeEvents()
  const { events: rawStudent, loading: loadingS, error: errorS } = useStudentEvents(
    isAdmin ? null : user?.uid, // Admins don't need personal student events
  )

  const collegeEvents = useMemo(
    () => rawCollege.map((e) => normalizeEvent(e, 'college')),
    [rawCollege],
  )

  const studentEvents = useMemo(
    () => rawStudent.map((e) => normalizeEvent(e, 'student')),
    [rawStudent],
  )

  const allEvents = useMemo(
    () => [...collegeEvents, ...studentEvents],
    [collegeEvents, studentEvents],
  )

  const loading = loadingC || loadingS
  const error = errorC || errorS

  const value = useMemo(
    () => ({
      collegeEvents,
      studentEvents,
      allEvents,
      rawCollegeEvents: rawCollege,
      rawStudentEvents: rawStudent,
      loading,
      error,
    }),
    [collegeEvents, studentEvents, allEvents, rawCollege, rawStudent, loading, error],
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export function useCalendar() {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider')
  return ctx
}
