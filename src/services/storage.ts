import type { AppDataV1, Apartment, ApartmentCalendarState, ApartmentId, UserId } from '../types'

const STORAGE_KEY = 'rental-crm-data-v1'
const SESSION_KEY = 'rental-crm-session'

export function loadAppData(): AppDataV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppDataV1
    if (parsed.schemaVersion !== 1) return emptyData()
    return {
      ...emptyData(),
      ...parsed,
      users: parsed.users ?? {},
      apartments: parsed.apartments ?? [],
      calendars: parsed.calendars ?? {},
    }
  } catch {
    return emptyData()
  }
}

export function saveAppData(data: AppDataV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function emptyData(): AppDataV1 {
  return {
    schemaVersion: 1,
    users: {},
    apartments: [],
    calendars: {},
  }
}

export function saveSessionToken(token: string | null): void {
  if (token) localStorage.setItem(SESSION_KEY, token)
  else localStorage.removeItem(SESSION_KEY)
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

/** Простой детерминированный «хэш» для демо; в проде — только сервер */
export function demoPasswordHash(password: string): string {
  let h = 2166136261
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `fnv1a:${(h >>> 0).toString(16)}`
}

export function findApartmentsByUser(data: AppDataV1, userId: UserId): Apartment[] {
  return data.apartments.filter((a) => a.userId === userId)
}

export function getCalendarState(
  data: AppDataV1,
  apartmentId: ApartmentId
): ApartmentCalendarState | undefined {
  return data.calendars[apartmentId]
}

export function ensureCalendarState(
  data: AppDataV1,
  apartmentId: ApartmentId
): ApartmentCalendarState {
  if (!data.calendars[apartmentId]) {
    data.calendars[apartmentId] = {
      apartmentId,
      nightPrices: {},
      manuallyBlockedDates: [],
      externalBookings: [],
      priceTemplates: [],
      icalFeeds: [],
    }
  }
  return data.calendars[apartmentId]
}
