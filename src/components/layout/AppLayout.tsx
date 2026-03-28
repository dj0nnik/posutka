import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'}`

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-soft)]">
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white">
              R
            </span>
            <span className="text-lg font-semibold tracking-tight text-neutral-900">RentStay</span>
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <NavLink to="/dashboard" className={navClass}>
              Объекты
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              Профиль
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden max-w-[140px] truncate text-sm text-neutral-600 sm:inline">
                {user.displayName}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:border-neutral-400"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
