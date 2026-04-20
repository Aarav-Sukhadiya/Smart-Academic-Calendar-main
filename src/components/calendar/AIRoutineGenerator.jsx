import { useState } from 'react'
import { generateStudyRoutine } from '../../services/aiService.js'
import { batchCreateStudentEvents } from '../../services/studentEvents.js'
import Button from '../ui/Button.jsx'

/**
 * AI Routine Generator component.
 * Shows a "Generate Study Routine" button, preview modal, and save functionality.
 */
export default function AIRoutineGenerator({ upcomingExams, studentId }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null) // array of suggested blocks
  const [selected, setSelected] = useState({}) // { index: boolean }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const blocks = await generateStudyRoutine(upcomingExams)
      setPreview(blocks)
      // Select all by default
      const sel = {}
      blocks.forEach((_, i) => { sel[i] = true })
      setSelected(sel)
    } catch (err) {
      setError(err.message || 'Failed to generate routine')
    } finally {
      setLoading(false)
    }
  }

  function toggleBlock(index) {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  function selectAll() {
    if (!preview) return
    const sel = {}
    preview.forEach((_, i) => { sel[i] = true })
    setSelected(sel)
  }

  function deselectAll() {
    setSelected({})
  }

  async function handleAccept() {
    if (!preview || !studentId) return
    const accepted = preview
      .filter((_, i) => selected[i])
      .map((block) => ({
        ...block,
        studentId,
        isAiGenerated: true,
      }))

    if (accepted.length === 0) {
      setError('Select at least one study block to add')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await batchCreateStudentEvents(accepted)
      setSuccess(true)
      setPreview(null)
      setSelected({})
    } catch (err) {
      setError(err.message || 'Failed to save study blocks')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div>
      {/* Generate Button */}
      {!preview && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="group flex items-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-3 text-sm font-semibold text-violet-700 transition-all duration-300 hover:border-violet-400 hover:from-violet-100 hover:to-purple-100 hover:shadow-lg hover:shadow-violet-200/50 disabled:opacity-60 dark:border-violet-700 dark:from-violet-900/20 dark:to-purple-900/20 dark:text-violet-300 dark:hover:border-violet-600 dark:hover:shadow-violet-900/30"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              Analyzing your schedule…
            </>
          ) : (
            <>
              <span className="text-lg transition-transform duration-300 group-hover:scale-110">✨</span>
              Generate AI Study Routine
            </>
          )}
        </button>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          ✅ Study blocks added to your calendar!
          <button
            onClick={() => setSuccess(false)}
            className="ml-2 text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:items-center">
          <div className="card w-full max-w-2xl overflow-hidden border-slate-200/60 shadow-2xl dark:shadow-none">
            {/* Header */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-4 dark:border-notion-border dark:from-violet-900/10 dark:to-purple-900/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-notion-text">
                    AI Study Plan Preview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-notion-muted">
                    {preview.length} study blocks over 5 days • {selectedCount} selected
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[400px] overflow-y-auto px-5 py-3">
              <div className="mb-3 flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                >
                  Deselect all
                </button>
              </div>

              <div className="space-y-2">
                {preview.map((block, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all duration-200 ${
                      selected[i]
                        ? 'border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-900/10'
                        : 'border-slate-200 bg-white opacity-60 dark:border-notion-border dark:bg-notion-sidebar'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selected[i]}
                      onChange={() => toggleBlock(i)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-notion-text">
                          {block.title}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-notion-muted">
                        <span>📅 {block.date}</span>
                        <span>🕐 {block.startTime} – {block.endTime}</span>
                      </div>
                      {block.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-notion-muted">
                          {block.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-notion-border dark:bg-notion-bg">
              <Button
                variant="ghost"
                onClick={() => { setPreview(null); setSelected({}) }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleAccept} disabled={saving || selectedCount === 0}>
                {saving
                  ? 'Adding to calendar…'
                  : `Accept ${selectedCount} block${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
