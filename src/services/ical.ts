import ICAL from 'ical.js'
import { format } from 'date-fns'
import type { ExternalBooking, ExternalBookingSource } from '../types'

/** Разбор текста .ics → внешние бронирования (VALUE=DATE: DTEND исключающий) */
export function parseIcsText(
  icsText: string,
  apartmentId: string,
  defaultLabel: string,
  source: ExternalBookingSource,
  icalFeedId?: string
): ExternalBooking[] {
  const jcalData = ICAL.parse(icsText)
  const comp = new ICAL.Component(jcalData)
  const vevents = comp.getAllSubcomponents('vevent')
  const out: ExternalBooking[] = []

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent)
    if (!event.startDate || !event.endDate) continue

    const startJs = event.startDate.toJSDate()
    const endJs = event.endDate.toJSDate()
    const startDay = format(startJs, 'yyyy-MM-dd')
    const endExclusiveStr = format(endJs, 'yyyy-MM-dd')

    out.push({
      id: `ical-${icalFeedId || 'x'}-${event.uid || startDay}-${startDay}`,
      apartmentId,
      start: startDay,
      end: endExclusiveStr,
      source,
      label: defaultLabel,
      externalUid: event.uid,
      icalFeedId,
    })
  }

  return out
}

/** Генерация .ics для экспорта */
export function buildIcsExport(params: {
  title: string
  blockedOrBookedRanges: { start: string; end: string; summary: string }[]
}): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rental CRM//RU//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(params.title)}`,
  ]
  const dtstamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")
  for (const r of params.blockedOrBookedRanges) {
    const uid = `${r.start}-${r.end}-${r.summary}`.replace(/\s/g, '')
    lines.push('BEGIN:VEVENT', `UID:${uid}@rental-crm`, `DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART;VALUE=DATE:${r.start.replace(/-/g, '')}`)
    lines.push(`DTEND;VALUE=DATE:${r.end.replace(/-/g, '')}`)
    lines.push(`SUMMARY:${escapeIcsText(r.summary)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function fetchIcsFromUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}
