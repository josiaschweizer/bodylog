import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="grid min-h-svh place-items-center bg-khaki-beige-50 text-chocolate-plum-800">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-pulse" size={38} aria-hidden="true" />
          <p className="text-sm font-medium text-dusty-taupe-700">BodyLog wird geladen …</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
