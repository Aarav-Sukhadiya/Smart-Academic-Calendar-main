import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const DEFAULT_DURATION = { success: 3500, info: 3500, error: 5000 }

const VARIANT_STYLES = {
  success: 'bg-emerald-600 text-white border-emerald-700',
  error: 'bg-rose-600 text-white border-rose-700',
  info: 'bg-slate-800 text-white border-slate-900',
}

const VARIANT_ICONS = { success: '✓', error: '!', info: 'i' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((variant, message, options = {}) => {
    const id = ++idRef.current
    const duration = options.duration ?? DEFAULT_DURATION[variant]
    setToasts((prev) => [...prev, { id, variant, message }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const toast = useMemo(() => ({
    success: (msg, opts) => show('success', msg, opts),
    error: (msg, opts) => show('error', msg, opts),
    info: (msg, opts) => show('info', msg, opts),
    dismiss,
  }), [show, dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-in ${VARIANT_STYLES[t.variant]}`}
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
            >
              {VARIANT_ICONS[t.variant]}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
