import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Heart } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Heart className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
