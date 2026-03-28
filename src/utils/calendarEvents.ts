import { addDays, isBefore, parseISO } from 'date-fns'
import type { Apartment, ApartmentCalendarState, ExternalBookingSource } from '../types'

export const SOURCE_COLORS: Record<ExternalBookingSource, string> = {
  avito: '#FF5A5F',
  sutochno: '#00A699',
  yandex: '#FC642D',
  ical: '#8B5CF6',
  other: '#717171',
}

export function nightPriceForDate(
  apt: Apartment,
  cal: ApartmentCalendarState,
  day: string
): number {
  return cal.nightPrices[day] ?? apt.defaultNightPrice
}

/** День занят внешним бронированием (ночь попадает в интервал [start, end)) */
export function isBookedExternally(cal: ApartmentCalendarState, day: string): boolean {
  const d = parseISO(day)
  for (const b of cal.externalBookings) {
    const s = parseISO(b.start)
    const e = parseISO(b.end)
    if (!isBefore(d, s) && isBefore(d, e)) return true
  }
  return false
}

export function isManuallyBlocked(cal: ApartmentCalendarState, day: string): boolean {
  return cal.manuallyBlockedDates.includes(day)
}

export interface CalendarEventItem {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource?: { kind: 'external' | 'blocked'; source?: ExternalBookingSource }
}

export function buildCalendarEvents(cal: ApartmentCalendarState): CalendarEventItem[] {
  const events: CalendarEventItem[] = []

  for (const b of cal.externalBookings) {
    events.push({
      id: b.id,
      title: b.label,
      start: parseISO(b.start),
      end: parseISO(b.end),
      allDay: true,
      resource: { kind: 'external', source: b.source },
    })
  }

  for (const day of cal.manuallyBlockedDates) {
    const start = parseISO(day)
    const end = addDays(start, 1)
    events.push({
      id: `block-${day}`,
      title: 'Закрыто',
      start,
      end,
      allDay: true,
      resource: { kind: 'blocked' },
    })
  }

  return events
}

export function eventStyleGetter(event: CalendarEventItem) {
  const r = event.resource
  if (r?.kind === 'blocked') {
    return { style: { backgroundColor: '#e5e5e5', color: '#525252', border: 'none' } }
  }
  const src = r?.source ?? 'other'
  const bg = SOURCE_COLORS[src] ?? SOURCE_COLORS.other
  return { style: { backgroundColor: bg, color: '#fff', border: 'none' } }
}
