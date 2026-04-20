import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-8 text-center">
      <div className="text-6xl">404</div>
      <p className="mt-2 text-slate-600">That page isn't on the schedule.</p>
      <Link to="/" className="mt-4 inline-block text-brand-600 underline">
        Back to dashboard
      </Link>
    </div>
  )
}
