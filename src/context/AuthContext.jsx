import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, firebaseConfigured } from '../services/firebase.js'
import {
  getUserRole,
  loginWithEmail,
  loginWithGoogle,
  logout as signOutUser,
  signupWithEmail,
} from '../services/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null) // 'admin' | 'student' | null
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    let cancelled = false
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      // Unblock the UI as soon as we know the auth state. The role lookup
      // hits Firestore and must not gate the spinner — a slow/blocked
      // Firestore read would otherwise freeze the whole app on "Loading…".
      setLoading(false)
      if (!u) {
        setRole(null)
        return
      }
      // Optimistic role guess from the auth profile so admins don't briefly
      // see a student UI before Firestore responds.
      const emailOrName = `${u.email || ''} ${u.displayName || ''}`.toLowerCase()
      setRole(emailOrName.includes('admin') ? 'admin' : 'student')
      getUserRole(u)
        .then((userRole) => {
          if (!cancelled && userRole) setRole(userRole)
        })
        .catch((err) => {
          console.error('Failed to fetch role:', err)
        })
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      isAdmin: role === 'admin',
      isStudent: role === 'student',
      firebaseConfigured,
      signup: signupWithEmail,
      login: loginWithEmail,
      loginWithGoogle,
      logout: signOutUser,
    }),
    [user, role, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
