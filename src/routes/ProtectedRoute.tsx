import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { DataProvider } from '../contexts/DataContext'

export function ProtectedRoute() {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return (
    <DataProvider userId={user.id}>
      <Outlet />
    </DataProvider>
  )
}
