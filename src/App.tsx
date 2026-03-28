import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { ApartmentEdit } from './pages/ApartmentEdit'
import { CalendarPage } from './pages/CalendarPage'

function HomeGate() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return <Home />
}

function LoginGate() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return <Login />
}

function RegisterGate() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return <Register />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />
      <Route path="/login" element={<LoginGate />} />
      <Route path="/register" element={<RegisterGate />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/apartments/new" element={<ApartmentEdit />} />
          <Route path="/apartments/:id/edit" element={<ApartmentEdit />} />
          <Route path="/apartments/:id/calendar" element={<CalendarPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
