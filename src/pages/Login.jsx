import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Button from '../components/ui/Button.jsx'

export default function Login() {
  const { user, loading, login, loginWithGoogle, firebaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) return null
  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function onGoogle() {
    setError(null)
    setSubmitting(true)
    try {
      await loginWithGoogle()
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Google login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-4 dark:from-notion-bg dark:via-notion-bg dark:to-notion-bg">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🎓</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-notion-text">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-notion-muted">
            Sign in to Smart Academic Calendar
          </p>
        </div>

        <div className="card overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/40 dark:shadow-none p-6">
          {!firebaseConfigured && (
            <div className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-200">
              Firebase is not configured. Add your credentials to <code>.env</code>.
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@university.edu"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-notion-muted">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Your password"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-notion-border" />
            or
            <div className="h-px flex-1 bg-slate-200 dark:bg-notion-border" />
          </div>

          <Button variant="ghost" onClick={onGoogle} disabled={submitting} className="w-full">
            Continue with Google
          </Button>

          <div className="mt-5 text-center text-xs text-slate-500 dark:text-notion-muted">
            No account?{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
