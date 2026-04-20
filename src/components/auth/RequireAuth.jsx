import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Spinner from '../ui/Spinner.jsx'

export default function RequireAuth() {
  const { user, loading, firebaseConfigured } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Loading…" />

  if (!firebaseConfigured) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Firebase not configured</h2>
          <p className="mt-2 text-sm text-slate-600">
            Copy <code>.env.example</code> to <code>.env</code> and fill in your Firebase project
            credentials, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return <Outlet />
}
