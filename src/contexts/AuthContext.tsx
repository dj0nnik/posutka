import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User, UserId } from '../types'
import {
  demoPasswordHash,
  getSessionToken,
  loadAppData,
  saveAppData,
  saveSessionToken,
} from '../services/storage'

interface AuthState {
  user: User | null
  session: Session | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  updateProfile: (displayName: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_MS = 1000 * 60 * 60 * 24 * 14

function sessionFromUser(user: User): Session {
  return {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + SESSION_MS,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => hydrateSession())

  const login = useCallback(async (email: string, password: string) => {
    const data = loadAppData()
    const normalized = email.trim().toLowerCase()
    const entry = Object.values(data.users).find((u) => u.email === normalized)
    if (!entry || entry.passwordHash !== demoPasswordHash(password)) {
      throw new Error('Неверный email или пароль')
    }
    const user: User = {
      id: entry.id,
      email: entry.email,
      displayName: entry.displayName,
      createdAt: entry.createdAt,
    }
    const session = sessionFromUser(user)
    saveSessionToken(`${user.id}:${session.expiresAt}`)
    setState({ user, session })
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const data = loadAppData()
    const normalized = email.trim().toLowerCase()
    if (Object.values(data.users).some((u) => u.email === normalized)) {
      throw new Error('Пользователь с таким email уже есть')
    }
    const id = crypto.randomUUID() as UserId
    const now = new Date().toISOString()
    data.users[id] = {
      id,
      email: normalized,
      displayName: displayName.trim() || normalized.split('@')[0],
      createdAt: now,
      passwordHash: demoPasswordHash(password),
    }
    saveAppData(data)
    const user: User = {
      id,
      email: normalized,
      displayName: data.users[id].displayName,
      createdAt: now,
    }
    const session = sessionFromUser(user)
    saveSessionToken(`${user.id}:${session.expiresAt}`)
    setState({ user, session })
  }, [])

  const logout = useCallback(() => {
    saveSessionToken(null)
    setState({ user: null, session: null })
  }, [])

  const updateProfile = useCallback((displayName: string) => {
    if (!state.user) return
    const data = loadAppData()
    const u = data.users[state.user.id]
    if (!u) return
    u.displayName = displayName.trim()
    saveAppData(data)
    setState((s) =>
      s.user ? { ...s, user: { ...s.user, displayName: u.displayName } } : s
    )
  }, [state.user])

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateProfile,
    }),
    [state, login, register, logout, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function hydrateSession(): AuthState {
  const raw = getSessionToken()
  if (!raw) return { user: null, session: null }
  const [userId, exp] = raw.split(':')
  const expiresAt = Number(exp)
  if (!userId || !expiresAt || Date.now() > expiresAt) {
    saveSessionToken(null)
    return { user: null, session: null }
  }
  const data = loadAppData()
  const u = data.users[userId as UserId]
  if (!u) {
    saveSessionToken(null)
    return { user: null, session: null }
  }
  const user: User = {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    createdAt: u.createdAt,
  }
  return {
    user,
    session: { userId: user.id, email: user.email, expiresAt },
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}
