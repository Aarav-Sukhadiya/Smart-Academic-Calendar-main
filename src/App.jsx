import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/auth/RequireAuth.jsx'
import RequireRole from './components/auth/RequireRole.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Spinner from './components/ui/Spinner.jsx'
import { CalendarProvider } from './context/CalendarContext.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<RequireAuth />}>
          <Route
            element={
              <CalendarProvider>
                <AppShell />
              </CalendarProvider>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <AdminPanel />
                </RequireRole>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
