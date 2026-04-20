import { useCallback, useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { useCalendar } from '../context/CalendarContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import CalendarLegend from '../components/calendar/CalendarLegend.jsx'
import CustomEvent from '../components/calendar/CustomEvent.jsx'
import EventModal from '../components/calendar/EventModal.jsx'
import AIRoutineGenerator from '../components/calendar/AIRoutineGenerator.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { createCollegeEvent, updateCollegeEvent, deleteCollegeEvent } from '../services/collegeEvents.js'
import { createStudentEvent, updateStudentEvent, deleteStudentEvent } from '../services/studentEvents.js'
import FilterBar from '../components/dashboard/FilterBar.jsx'

const localizer = momentLocalizer(moment)
const CALENDAR_MIN = new Date(1970, 0, 1, 7, 0)
const CALENDAR_MAX = new Date(1970, 0, 1, 22, 0)
const CALENDAR_VIEWS = ['month', 'week', 'day', 'agenda']
const CALENDAR_STYLE = { minHeight: 600 }

/**
 * Returns the style for each event based on its type and source.
 */
function eventStyleGetter(event) {
  const colorMap = {
    lecture: { bg: '#6366f1', border: '#4f46e5' },      // indigo
    exam: { bg: '#f43f5e', border: '#e11d48' },          // rose
    assignment: { bg: '#f59e0b', border: '#d97706' },    // amber
    holiday: { bg: '#14b8a6', border: '#0d9488' },       // teal
    personal: { bg: '#10b981', border: '#059669' },      // emerald
  }

  let colors
  if (event.isAiGenerated) {
    colors = { bg: '#8b5cf6', border: '#7c3aed' } // violet for AI
  } else {
    colors = colorMap[event.type] || colorMap.personal
  }

  return {
    style: {
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderLeft: `3px solid ${colors.border}`,
      borderRadius: '6px',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 500,
      padding: '2px 6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
  }
}

export default function Dashboard() {
  const { user, isAdmin, isStudent } = useAuth()
  const { allEvents, collegeEvents, loading, error } = useCalendar()
  const toast = useToast()

  const [selectedEvent, setSelectedEvent] = useState(null) // normalized event or null
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createSlot, setCreateSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filters State
  const [activeBatch, setActiveBatch] = useState('2029')
  const [activeGroup, setActiveGroup] = useState(isAdmin ? 'All' : 'A')
  const [hideEnglishIII, setHideEnglishIII] = useState(false)

  // Apply Filters to Calendar Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // 1. Personal events always show
      if (event.source !== 'college') return true

      // 2. Batch check
      if (event.raw?.batch && event.raw.batch !== activeBatch) return false

      // 3. Group check (allow if Admin chose 'All', or if event is for 'All', or exact match)
      if (activeGroup !== 'All' && event.raw?.group !== 'All' && event.raw?.group !== activeGroup) {
        return false
      }

      // 4. English III check
      if (hideEnglishIII && event.raw?.subject?.toLowerCase().includes('english')) {
        return false
      }

      return true
    })
  }, [allEvents, activeBatch, activeGroup, hideEnglishIII])

  // Upcoming exams for AI generator (next 30 days)
  const upcomingExams = useMemo(() => {
    const now = new Date()
    const thirtyDaysLater = new Date(now)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    return collegeEvents
      .filter((e) => {
        const eventDate = new Date(e.start)
        return (
          (e.type === 'exam' || e.type === 'assignment') &&
          eventDate >= now &&
          eventDate <= thirtyDaysLater
        )
      })
      .map((e) => ({
        title: e.title,
        date: e.raw?.date || e.start.toISOString().split('T')[0],
        type: e.type,
      }))
  }, [collegeEvents])

  // Handle clicking on an existing event
  const handleSelectEvent = useCallback((event) => {
    // Only allow editing own events
    if (event.source === 'college' && !isAdmin) {
      // Students can view but not edit college events
      setSelectedEvent({ ...event, readOnly: true })
    } else {
      setSelectedEvent(event)
    }
  }, [isAdmin])

  // Handle clicking empty slot to create
  const handleSelectSlot = useCallback(({ start, end }) => {
    const date = start.toISOString().split('T')[0]
    const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    setCreateSlot({ date, startTime, endTime })
    setShowCreateModal(true)
  }, [])

  // Firestore's addDoc/updateDoc resolve on server-ack, but onSnapshot already
  // reflects the change from the local cache instantly. So we close the modal
  // up-front — waiting on the network round-trip is what caused the "Saving…"
  // button to look stuck even though the event was already visible.
  async function handleCreate(payload) {
    if (submitting) return
    setSubmitting(true)
    setShowCreateModal(false)
    setCreateSlot(null)
    try {
      if (isAdmin) {
        await createCollegeEvent({ ...payload, createdBy: user.uid })
      } else {
        await createStudentEvent({ ...payload, studentId: user.uid })
      }
      toast.success(`“${payload.title}” added to your calendar`)
    } catch (err) {
      console.error('Create event failed:', err)
      toast.error(err?.message || 'Could not save event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(payload) {
    if (!selectedEvent?.id || submitting) return
    const source = selectedEvent.source
    const id = selectedEvent.id
    setSubmitting(true)
    setSelectedEvent(null)
    try {
      if (source === 'college') {
        await updateCollegeEvent(id, payload)
      } else {
        await updateStudentEvent(id, payload)
      }
      toast.success('Event updated')
    } catch (err) {
      console.error('Update event failed:', err)
      toast.error(err?.message || 'Could not update event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!selectedEvent?.id || submitting) return
    const source = selectedEvent.source
    const id = selectedEvent.id
    setSubmitting(true)
    setSelectedEvent(null)
    try {
      if (source === 'college') {
        await deleteCollegeEvent(id)
      } else {
        await deleteStudentEvent(id)
      }
      toast.success('Event deleted')
    } catch (err) {
      console.error('Delete event failed:', err)
      toast.error(err?.message || 'Could not delete event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Memoize react-big-calendar's `components` prop — a fresh object literal
  // each render forces the calendar to recreate its internal component tree.
  const calendarComponents = useMemo(() => ({ event: CustomEvent }), [])

  const name = user?.displayName?.split(' ')[0] || 'there'

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="card p-6 text-center">
          <div className="text-base font-semibold text-red-700">Failed to load calendar</div>
          <p className="mt-1 text-sm text-red-500">{error.message || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-notion-text">
            Hey {name} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-notion-muted">
            {isAdmin
              ? 'Manage your college schedule'
              : 'Your unified academic & personal calendar'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Generator for students only */}
          {isStudent && (
            <AIRoutineGenerator
              upcomingExams={upcomingExams}
              studentId={user?.uid}
            />
          )}
          <button
            onClick={() => {
              setCreateSlot({
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
              })
              setShowCreateModal(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl dark:shadow-indigo-900/30"
          >
            <span className="text-base">+</span>
            {isAdmin ? 'College Event' : 'Personal Event'}
          </button>
        </div>
      </div>

      <FilterBar
        batch={activeBatch} setBatch={setActiveBatch}
        group={activeGroup} setGroup={setActiveGroup}
        hideEnglishIII={hideEnglishIII} setHideEnglishIII={setHideEnglishIII}
      />

      {/* Legend */}
      <div className="mb-4">
        <CalendarLegend />
      </div>

      {/* Calendar */}
      {loading ? (
        <Spinner label="Loading your calendar…" />
      ) : (
        <div className="card overflow-hidden border-slate-200/60 shadow-lg shadow-slate-100/50 dark:shadow-none">
          <div className="calendar-wrapper p-2 md:p-4">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={setCurrentDate}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter}
              components={calendarComponents}
              views={CALENDAR_VIEWS}
              defaultView="week"
              min={CALENDAR_MIN}
              max={CALENDAR_MAX}
              step={30}
              timeslots={2}
              popup
              style={CALENDAR_STYLE}
            />
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <EventModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateSlot(null) }}
        onSubmit={handleCreate}
        initial={createSlot}
        mode={isAdmin ? 'college' : 'student'}
        submitting={submitting}
      />

      {/* Edit Event Modal */}
      {selectedEvent && !selectedEvent.readOnly && (
        <EventModal
          open={true}
          onClose={() => setSelectedEvent(null)}
          onSubmit={handleEdit}
          onDelete={handleDelete}
          initial={selectedEvent}
          mode={selectedEvent.source === 'college' ? 'college' : 'student'}
          submitting={submitting}
        />
      )}

      {/* Read-only event view for students viewing college events */}
      {selectedEvent?.readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md overflow-hidden shadow-2xl">
            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 dark:border-notion-border dark:from-indigo-900/10 dark:to-purple-900/10">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-notion-text">
                  College Event
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-notion-hover"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 dark:text-notion-muted">Title</div>
                <div className="text-sm font-medium text-slate-800 dark:text-notion-text">{selectedEvent.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-notion-muted">Date</div>
                  <div className="text-sm text-slate-700 dark:text-notion-text">{selectedEvent.raw?.date}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-notion-muted">Time</div>
                  <div className="text-sm text-slate-700 dark:text-notion-text">
                    {selectedEvent.raw?.startTime} – {selectedEvent.raw?.endTime}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 dark:text-notion-muted">Type</div>
                <div className="text-sm capitalize text-slate-700 dark:text-notion-text">{selectedEvent.type}</div>
              </div>
              {selectedEvent.description && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 dark:text-notion-muted">Description</div>
                  <div className="text-sm text-slate-600 dark:text-notion-muted">{selectedEvent.description}</div>
                </div>
              )}
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/10 dark:text-amber-300">
                🔒 College events are read-only for students
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
