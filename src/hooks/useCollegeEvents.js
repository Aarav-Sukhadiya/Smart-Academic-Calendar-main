import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeToCollegeEvents } from '../services/collegeEvents.js'

const FIRST_SNAPSHOT_TIMEOUT_MS = 15000

export function useCollegeEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Persist across StrictMode remounts — once any mount has received a
  // snapshot or errored, later mounts should not re-arm the timeout.
  const settledRef = useRef(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (settledRef.current) return
      settledRef.current = true
      setError(new Error(
        'Timed out waiting for Firestore. Check your network and Firebase config (VITE_FIREBASE_* env vars), then reload.',
      ))
      setLoading(false)
    }, FIRST_SNAPSHOT_TIMEOUT_MS)

    const unsub = subscribeToCollegeEvents(
      (list) => {
        settledRef.current = true
        clearTimeout(timeoutId)
        setEvents(list)
        setLoading(false)
      },
      (err) => {
        settledRef.current = true
        clearTimeout(timeoutId)
        setError(err)
        setLoading(false)
      },
    )
    return () => {
      clearTimeout(timeoutId)
      unsub()
    }
  }, [])

  const refetch = useCallback(() => {
    // Firestore onSnapshot auto-updates; this is a no-op placeholder
  }, [])

  return { events, loading, error, refetch }
}
