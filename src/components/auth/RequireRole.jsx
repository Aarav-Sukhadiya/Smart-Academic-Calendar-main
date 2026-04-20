import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import Spinner from '../ui/Spinner.jsx'

/**
 * Route guard that checks user role.
 * Usage: <RequireRole role="admin"><AdminPanel /></RequireRole>
 */
export default function RequireRole({ role, children }) {
  const { role: userRole, loading } = useAuth()

  if (loading) return <Spinner label="Checking permissions…" />

  if (userRole !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
