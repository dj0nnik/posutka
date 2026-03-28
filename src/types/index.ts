/**
 * Модели данных — рассчитаны на перенос на API: id как string (UUID), userId на всех сущностях.
 */

export type UserId = string
export type ApartmentId = string

export interface User {
  id: UserId
  email: string
  displayName: string
  createdAt: string
}

/** Сессия в браузере; на бэкенде заменится на JWT + refresh */
export interface Session {
  userId: UserId
  email: string
  expiresAt: number
}

export type PlatformLinkKey = 'avito' | 'sutochno' | 'yandexTravel'

export interface ApartmentLinks {
  avito: string
  sutochno: string
  yandexTravel: string
}

export const MAX_APARTMENTS_PER_USER = 20

export interface Apartment {
  id: ApartmentId
  userId: UserId
  title: string
  addressShort: string
  descriptionShort: string
  links: ApartmentLinks
  /** Базовая цена за ночь (если нет переопределения по дню) */
  defaultNightPrice: number
  createdAt: string
  updatedAt: string
}

/** Источник внешнего бронирования для отображения и iCal */
export type ExternalBookingSource =
  | 'avito'
  | 'sutochno'
  | 'yandex'
  | 'ical'
  | 'other'

export interface ExternalBooking {
  id: string
  apartmentId: ApartmentId
  /** Начало дня заезда */
  start: string
  /** Конец периода (день выезда, не включительно — как DTEND в iCal all-day) */
  end: string
  source: ExternalBookingSource
  /** Подпись в календаре: «Авито», «Суточно» и т.д. */
  label: string
  /** id события из iCal при необходимости */
  externalUid?: string
  /** Привязка к фиду для перезаписи при обновлении URL */
  icalFeedId?: string
}

export interface ICalFeed {
  id: string
  apartmentId: ApartmentId
  url: string
  /** Как подписывать брони с этого фида */
  label: string
  source: ExternalBookingSource
  lastFetchedAt: string | null
  lastError: string | null
  /** интервал автообновления, мс (0 = только вручную) */
  refreshIntervalMs: number
}

export type PriceTemplateKind = 'weekday' | 'weekend' | 'holiday' | 'custom'

export interface PriceTemplate {
  id: string
  apartmentId: ApartmentId
  name: string
  kind: PriceTemplateKind
  /** Цена за ночь при применении шаблона */
  pricePerNight: number
}

/** Состояние календаря по одному объекту */
export interface ApartmentCalendarState {
  apartmentId: ApartmentId
  /** Переопределение цены по дню YYYY-MM-DD */
  nightPrices: Record<string, number>
  /** Вручную закрытые даты (не бронь, просто стоп-сейл) */
  manuallyBlockedDates: string[]
  externalBookings: ExternalBooking[]
  priceTemplates: PriceTemplate[]
  icalFeeds: ICalFeed[]
}

export interface AppDataV1 {
  schemaVersion: 1
  users: Record<UserId, User & { passwordHash: string }>
  apartments: Apartment[]
  calendars: Record<ApartmentId, ApartmentCalendarState>
}
