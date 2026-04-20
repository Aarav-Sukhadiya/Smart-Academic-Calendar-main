import { useState } from 'react'
import { useCalendar } from '../context/CalendarContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import EventModal from '../components/calendar/EventModal.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import {
  createCollegeEvent,
  updateCollegeEvent,
  deleteCollegeEvent,
} from '../services/collegeEvents.js'
import { runTimetableSeed } from '../utils/seedTimetable.js'

const typeColors = {
  lecture: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  exam: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  assignment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  holiday: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}

const typeIcons = {
  lecture: '📚',
  exam: '📝',
  assignment: '📋',
  holiday: '🎉',
}

export default function AdminPanel() {
  const { user } = useAuth()
  const { rawCollegeEvents, loading, error } = useCalendar()
  const toast = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [seeding, setSeeding] = useState(false)

  const filteredEvents = filter === 'all'
    ? rawCollegeEvents
    : rawCollegeEvents.filter((e) => e.type === filter)

  async function handleCreate(payload) {
    if (submitting) return
    setSubmitting(true)
    setShowCreate(false)
    try {
      await createCollegeEvent({ ...payload, createdBy: user.uid })
      toast.success(`“${payload.title}” added to college calendar`)
    } catch (err) {
      console.error('Failed to create event:', err)
      toast.error(err?.message || 'Could not create event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(payload) {
    if (!editing?.id || submitting) return
    const id = editing.id
    setSubmitting(true)
    setEditing(null)
    try {
      await updateCollegeEvent(id, payload)
      toast.success('Event updated')
    } catch (err) {
      console.error('Failed to update event:', err)
      toast.error(err?.message || 'Could not update event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editing?.id || submitting) return
    const id = editing.id
    setSubmitting(true)
    setEditing(null)
    try {
      await deleteCollegeEvent(id)
      toast.success('Event deleted')
    } catch (err) {
      console.error('Failed to delete event:', err)
      toast.error(err?.message || 'Could not delete event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="card p-6 text-center">
          <div className="text-base font-semibold text-red-700">Error loading events</div>
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-notion-text">
            🛡️ Admin Panel
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-notion-muted">
            Manage official college events, lectures, and exam schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm('This will insert 16 weeks of timetable data. Proceed?')) return
              setSeeding(true)
              try {
                const count = await runTimetableSeed(user.uid)
                alert(`Successfully seeded ${count} events!`)
              } catch (err) {
                alert('Seeding failed: ' + err.message)
              } finally {
                setSeeding(false)
              }
            }}
            disabled={seeding}
          >
            {seeding ? 'Seeding...' : '🌱 Seed Timetable'}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            + New College Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'lecture', label: '📚 Lectures' },
          { value: 'exam', label: '📝 Exams' },
          { value: 'assignment', label: '📋 Assignments' },
          { value: 'holiday', label: '🎉 Holidays' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-notion-hover dark:text-notion-muted dark:hover:bg-notion-active'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <Spinner label="Loading events…" />
      ) : filteredEvents.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-base font-semibold text-slate-700 dark:text-notion-text">
            No events found
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-notion-muted">
            {filter !== 'all' ? 'Try a different filter or ' : ''}Create your first college event to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setEditing(event)}
              className="card flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <div className="text-2xl">
                {typeIcons[event.type] || '📌'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-notion-text truncate">
                    {event.title}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeColors[event.type] || 'bg-slate-100 text-slate-600'}`}>
                    {event.type}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-notion-muted truncate">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-medium text-slate-700 dark:text-notion-text">
                  {event.date}
                </div>
                <div className="text-xs text-slate-400 dark:text-notion-muted">
                  {event.startTime && event.endTime
                    ? `${event.startTime} – ${event.endTime}`
                    : 'All day'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredEvents.length > 0 && (
        <div className="mt-4 text-center text-xs text-slate-400 dark:text-notion-muted">
          Showing {filteredEvents.length} of {rawCollegeEvents.length} events
        </div>
      )}

      {/* Create Modal */}
      <EventModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        mode="college"
        submitting={submitting}
      />

      {/* Edit Modal */}
      {editing && (
        <EventModal
          open={true}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
          onDelete={handleDelete}
          initial={editing}
          mode="college"
          submitting={submitting}
        />
      )}
    </div>
  )
}
