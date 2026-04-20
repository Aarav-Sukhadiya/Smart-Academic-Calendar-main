import { useState } from 'react'
import Button from '../ui/Button.jsx'

const EVENT_TYPES = [
  { value: 'lecture', label: '📚 Lecture' },
  { value: 'exam', label: '📝 Exam' },
  { value: 'assignment', label: '📋 Assignment' },
  { value: 'holiday', label: '🎉 Holiday' },
]

/**
 * Modal form for creating/editing events.
 * - mode='college' → admin creating college events
 * - mode='student' → student creating personal events
 */
export default function EventModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initial,
  mode = 'student',
  submitting = false,
}) {
  const isEdit = Boolean(initial?.id)

  const [title, setTitle] = useState(initial?.title || initial?.raw?.title || '')
  const [date, setDate] = useState(
    initial?.raw?.date || initial?.date || new Date().toISOString().split('T')[0],
  )
  const [startTime, setStartTime] = useState(initial?.raw?.startTime || initial?.startTime || '09:00')
  const [endTime, setEndTime] = useState(initial?.raw?.endTime || initial?.endTime || '10:00')
  const [description, setDescription] = useState(initial?.raw?.description || initial?.description || '')
  const [type, setType] = useState(initial?.raw?.type || initial?.type || 'lecture')
  
  // New Fields for College Events
  const [batch, setBatch] = useState(initial?.raw?.batch || initial?.batch || '2029')
  const [group, setGroup] = useState(initial?.raw?.group || initial?.group || 'All')
  const [subject, setSubject] = useState(initial?.raw?.subject || initial?.subject || '')
  const [faculty, setFaculty] = useState(initial?.raw?.faculty || initial?.faculty || '')
  const [classroom, setClassroom] = useState(initial?.raw?.classroom || initial?.classroom || '')

  const [error, setError] = useState(null)

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!date) {
      setError('Date is required')
      return
    }

    const payload = {
      title: title.trim(),
      date,
      startTime,
      endTime,
      description: description.trim(),
    }

    if (mode === 'college') {
      payload.type = type
      payload.batch = batch
      payload.group = group
      payload.subject = subject.trim()
      payload.faculty = faculty.trim()
      payload.classroom = classroom.trim()
    }

    onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:items-center">
      <div
        className="card w-full max-w-lg overflow-hidden border-slate-200/60 shadow-2xl dark:shadow-none animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 dark:border-notion-border dark:from-notion-sidebar dark:to-notion-sidebar">
          <h2 className="text-base font-bold text-slate-900 dark:text-notion-text">
            {isEdit ? 'Edit Event' : mode === 'college' ? 'New College Event' : 'New Personal Event'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-notion-hover"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
              Title *
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'college' ? 'e.g. Data Science Lecture' : 'e.g. Study Session'}
              required
            />
          </div>

          {mode === 'college' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
                  Event Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        type === t.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-notion-border dark:text-notion-muted dark:hover:bg-notion-hover'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">Subject / Course</label>
                  <input type="text" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Fundamental DSA" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">Faculty Name</label>
                  <input type="text" className="input" value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="e.g. Navdeep" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">Batch</label>
                  <select className="input" value={batch} onChange={(e) => setBatch(e.target.value)}>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">Group</label>
                  <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
                    <option value="All">All Groups</option>
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                    <option value="C">Group C</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">Classroom</label>
                  <input type="text" className="input" value={classroom} onChange={(e) => setClassroom(e.target.value)} placeholder="e.g. Class A - 2nd Floor" />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
                Date *
              </label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
                Start
              </label>
              <input
                type="time"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
                End
              </label>
              <input
                type="time"
                className="input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
              Description
            </label>
            <textarea
              className="input min-h-[60px] resize-y"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isEdit && onDelete ? (
              <Button
                type="button"
                variant="danger"
                onClick={onDelete}
                disabled={submitting}
                className="text-xs"
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
