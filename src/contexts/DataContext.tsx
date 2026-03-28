import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Apartment,
  ApartmentCalendarState,
  ApartmentId,
  ICalFeed,
  PriceTemplate,
  UserId,
} from '../types'
import { MAX_APARTMENTS_PER_USER } from '../types'
import {
  ensureCalendarState,
  findApartmentsByUser,
  loadAppData,
  saveAppData,
} from '../services/storage'
import { fetchIcsFromUrl, parseIcsText } from '../services/ical'
import { buildIcsExport } from '../services/ical'
import { addDays, eachDayOfInterval, format, max, min, parseISO } from 'date-fns'

interface DataContextValue {
  apartments: Apartment[]
  refresh: () => void
  createApartment: (input: Omit<Apartment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Apartment
  updateApartment: (id: ApartmentId, patch: Partial<Pick<Apartment, 'title' | 'addressShort' | 'descriptionShort' | 'links' | 'defaultNightPrice'>>) => void
  deleteApartment: (id: ApartmentId) => void
  getCalendar: (apartmentId: ApartmentId) => ApartmentCalendarState
  setNightPricesForRange: (apartmentId: ApartmentId, start: Date, end: Date, price: number) => void
  toggleManualBlockRange: (apartmentId: ApartmentId, start: Date, end: Date, blocked: boolean) => void
  addPriceTemplate: (apartmentId: ApartmentId, t: Omit<PriceTemplate, 'id' | 'apartmentId'>) => void
  removePriceTemplate: (apartmentId: ApartmentId, templateId: string) => void
  applyTemplateToRange: (apartmentId: ApartmentId, templateId: string, start: Date, end: Date) => void
  addIcalFeed: (apartmentId: ApartmentId, feed: Omit<ICalFeed, 'id' | 'apartmentId' | 'lastFetchedAt' | 'lastError'>) => void
  removeIcalFeed: (apartmentId: ApartmentId, feedId: string) => void
  refreshIcalFeed: (apartmentId: ApartmentId, feedId: string) => Promise<void>
  exportIcs: (apartmentId: ApartmentId) => string
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ userId, children }: { userId: UserId; children: ReactNode }) {
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const apartments = useMemo(() => {
    void version
    return findApartmentsByUser(loadAppData(), userId)
  }, [userId, version])

  const createApartment = useCallback(
    (input: Omit<Apartment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const data = loadAppData()
      const list = findApartmentsByUser(data, userId)
      if (list.length >= MAX_APARTMENTS_PER_USER) {
        throw new Error(`Можно не более ${MAX_APARTMENTS_PER_USER} объектов`)
      }
      const now = new Date().toISOString()
      const id = crypto.randomUUID()
      const apt: Apartment = {
        id,
        userId,
        title: input.title,
        addressShort: input.addressShort,
        descriptionShort: input.descriptionShort,
        links: input.links,
        defaultNightPrice: input.defaultNightPrice ?? 3000,
        createdAt: now,
        updatedAt: now,
      }
      data.apartments.push(apt)
      ensureCalendarState(data, id)
      saveAppData(data)
      refresh()
      return apt
    },
    [userId, refresh]
  )

  const updateApartment = useCallback(
    (id: ApartmentId, patch: Partial<Pick<Apartment, 'title' | 'addressShort' | 'descriptionShort' | 'links' | 'defaultNightPrice'>>) => {
      const data = loadAppData()
      const apt = data.apartments.find((a) => a.id === id && a.userId === userId)
      if (!apt) return
      Object.assign(apt, patch, { updatedAt: new Date().toISOString() })
      saveAppData(data)
      refresh()
    },
    [userId, refresh]
  )

  const deleteApartment = useCallback(
    (id: ApartmentId) => {
      const data = loadAppData()
      data.apartments = data.apartments.filter((a) => !(a.id === id && a.userId === userId))
      delete data.calendars[id]
      saveAppData(data)
      refresh()
    },
    [userId, refresh]
  )

  const getCalendar = useCallback(
    (apartmentId: ApartmentId): ApartmentCalendarState => {
      const data = loadAppData()
      return ensureCalendarState(data, apartmentId)
    },
    []
  )

  const setNightPricesForRange = useCallback(
    (apartmentId: ApartmentId, start: Date, end: Date, price: number) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      const from = min([start, end])
      const to = max([start, end])
      const days = eachDayOfInterval({ start: from, end: to })
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd')
        cal.nightPrices[key] = price
      }
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const toggleManualBlockRange = useCallback(
    (apartmentId: ApartmentId, start: Date, end: Date, blocked: boolean) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      const from = min([start, end])
      const to = max([start, end])
      const days = eachDayOfInterval({ start: from, end: to })
      const set = new Set(cal.manuallyBlockedDates)
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd')
        if (blocked) set.add(key)
        else set.delete(key)
      }
      cal.manuallyBlockedDates = Array.from(set)
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const addPriceTemplate = useCallback(
    (apartmentId: ApartmentId, t: Omit<PriceTemplate, 'id' | 'apartmentId'>) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      cal.priceTemplates.push({
        ...t,
        id: crypto.randomUUID(),
        apartmentId,
      })
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const removePriceTemplate = useCallback(
    (apartmentId: ApartmentId, templateId: string) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      cal.priceTemplates = cal.priceTemplates.filter((x) => x.id !== templateId)
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const applyTemplateToRange = useCallback(
    (apartmentId: ApartmentId, templateId: string, start: Date, end: Date) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      const apt = data.apartments.find((a) => a.id === apartmentId)
      const t = cal.priceTemplates.find((x) => x.id === templateId)
      if (!t || !apt) return
      const price = t.pricePerNight
      const from = min([start, end])
      const to = max([start, end])
      const days = eachDayOfInterval({ start: from, end: to })
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd')
        let use = price
        if (t.kind === 'weekend') {
          const day = d.getDay()
          if (day !== 0 && day !== 6) use = apt.defaultNightPrice
        }
        if (t.kind === 'weekday') {
          const day = d.getDay()
          if (day === 0 || day === 6) use = apt.defaultNightPrice
        }
        cal.nightPrices[key] = use
      }
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const addIcalFeed = useCallback(
    (apartmentId: ApartmentId, feed: Omit<ICalFeed, 'id' | 'apartmentId' | 'lastFetchedAt' | 'lastError'>) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      cal.icalFeeds.push({
        ...feed,
        id: crypto.randomUUID(),
        apartmentId,
        lastFetchedAt: null,
        lastError: null,
      })
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const removeIcalFeed = useCallback(
    (apartmentId: ApartmentId, feedId: string) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      cal.icalFeeds = cal.icalFeeds.filter((f) => f.id !== feedId)
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const refreshIcalFeed = useCallback(
    async (apartmentId: ApartmentId, feedId: string) => {
      const data = loadAppData()
      const cal = ensureCalendarState(data, apartmentId)
      const feed = cal.icalFeeds.find((f) => f.id === feedId)
      if (!feed) return
      try {
        const text = await fetchIcsFromUrl(feed.url)
        const parsed = parseIcsText(text, apartmentId, feed.label, feed.source, feed.id)
        cal.externalBookings = cal.externalBookings.filter((b) => b.icalFeedId !== feed.id)
        cal.externalBookings.push(...parsed)
        feed.lastFetchedAt = new Date().toISOString()
        feed.lastError = null
      } catch (e) {
        feed.lastError = e instanceof Error ? e.message : 'Ошибка загрузки'
      }
      saveAppData(data)
      refresh()
    },
    [refresh]
  )

  const exportIcs = useCallback((apartmentId: ApartmentId): string => {
    const data = loadAppData()
    const apt = data.apartments.find((a) => a.id === apartmentId)
    const cal = data.calendars[apartmentId]
    if (!apt || !cal) return ''
    const ranges: { start: string; end: string; summary: string }[] = []
    for (const b of cal.externalBookings) {
      ranges.push({
        start: b.start,
        end: b.end,
        summary: `${b.label} (${b.source})`,
      })
    }
    for (const d of cal.manuallyBlockedDates) {
      ranges.push({
        start: d,
        end: format(addDays(parseISO(d), 1), 'yyyy-MM-dd'),
        summary: 'Закрыто',
      })
    }
    return buildIcsExport({ title: apt.title, blockedOrBookedRanges: ranges })
  }, [])

  const value = useMemo(
    () => ({
      apartments,
      refresh,
      createApartment,
      updateApartment,
      deleteApartment,
      getCalendar,
      setNightPricesForRange,
      toggleManualBlockRange,
      addPriceTemplate,
      removePriceTemplate,
      applyTemplateToRange,
      addIcalFeed,
      removeIcalFeed,
      refreshIcalFeed,
      exportIcs,
    }),
    [
      apartments,
      refresh,
      createApartment,
      updateApartment,
      deleteApartment,
      getCalendar,
      setNightPricesForRange,
      toggleManualBlockRange,
      addPriceTemplate,
      removePriceTemplate,
      applyTemplateToRange,
      addIcalFeed,
      removeIcalFeed,
      refreshIcalFeed,
      exportIcs,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData вне DataProvider')
  return ctx
}
