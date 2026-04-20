import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeToStudentEvents } from '../services/studentEvents.js'

const FIRST_SNAPSHOT_TIMEOUT_MS = 15000

export function useStudentEvents(studentId) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(Boolean(studentId))
  const [error, setError] = useState(null)
  // Keyed by studentId so a change in studentId resets the settled state,
  // but StrictMode's double-mount for the same studentId shares it.
  const settledRef = useRef({ id: null, settled: false })

  useEffect(() => {
    if (!studentId) {
      setEvents([])
      setLoading(false)
      return
    }
    if (settledRef.current.id !== studentId) {
      settledRef.current = { id: studentId, settled: false }
    }
    setLoading(true)

    const timeoutId = setTimeout(() => {
      if (settledRef.current.settled) return
      settledRef.current.settled = true
      setError(new Error(
        'Timed out waiting for Firestore. Check your network and Firebase config (VITE_FIREBASE_* env vars), then reload.',
      ))
      setLoading(false)
    }, FIRST_SNAPSHOT_TIMEOUT_MS)

    const unsub = subscribeToStudentEvents(
      studentId,
      (list) => {
        settledRef.current.settled = true
        clearTimeout(timeoutId)
        setEvents(list)
        setLoading(false)
      },
      (err) => {
        settledRef.current.settled = true
        clearTimeout(timeoutId)
        setError(err)
        setLoading(false)
      },
    )
    return () => {
      clearTimeout(timeoutId)
      unsub()
    }
  }, [studentId])

  const refetch = useCallback(() => {
    // Firestore onSnapshot auto-updates
  }, [])

  return { events, loading, error, refetch }
}
