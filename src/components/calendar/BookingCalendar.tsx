import { useMemo, useCallback, useState } from 'react'
import { Calendar, dateFnsLocalizer, type SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Apartment, ApartmentCalendarState } from '../../types'
import {
  buildCalendarEvents,
  eventStyleGetter,
  nightPriceForDate,
  type CalendarEventItem,
} from '../../utils/calendarEvents'

const locales = { ru }

const localizer = dateFnsLocalizer({
  format,
  parse: (str: string, fmt: string, ref?: Date) => parse(str, fmt, ref ?? new Date()),
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: ru }),
  getDay,
  locales,
})

const messages = {
  date: 'Дата',
  time: 'Время',
  event: 'Событие',
  allDay: 'Весь день',
  week: 'Неделя',
  work_week: 'Рабочая неделя',
  day: 'День',
  month: 'Месяц',
  previous: 'Назад',
  next: 'Вперёд',
  yesterday: 'Вчера',
  tomorrow: 'Завтра',
  today: 'Сегодня',
  agenda: 'Повестка',
  noEventsInRange: 'Нет событий в этом диапазоне',
  showMore: (n: number) => `+ ещё ${n}`,
}

type Props = {
  apartment: Apartment
  calendar: ApartmentCalendarState
  onSelectRange: (start: Date, endInclusive: Date) => void
}

export function BookingCalendar({ apartment, calendar, onSelectRange }: Props) {
  const [view] = useState<'month'>('month')

  const events = useMemo(
    () => buildCalendarEvents(calendar) as CalendarEventItem[],
    [calendar]
  )

  const onSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      const s = startOfDay(slotInfo.start as Date)
      const endRaw = startOfDay(slotInfo.end as Date)
      const endInclusive = addDays(endRaw, -1)
      const last = endInclusive < s ? s : endInclusive
      onSelectRange(s, last)
    },
    [onSelectRange]
  )

  const components = useMemo(
    () => ({
      dateCellWrapper: ({
        children,
        value,
      }: {
        children: React.ReactNode
        value: Date
      }) => {
        const day = format(value, 'yyyy-MM-dd')
        const price = nightPriceForDate(apartment, calendar, day)
        return (
          <div className="relative h-full min-h-[76px] w-full">
            {children}
            <span className="pointer-events-none absolute bottom-1 right-1 text-[10px] font-medium text-neutral-500">
              {price.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        )
      },
    }),
    [apartment, calendar]
  )

  return (
    <div className="rbc-outer">
      <Calendar
        culture="ru"
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 720 }}
        views={['month']}
        view={view}
        defaultDate={new Date()}
        selectable
        popup
        messages={messages}
        eventPropGetter={eventStyleGetter}
        components={components}
        onSelectSlot={onSelectSlot}
        toolbar
      />
    </div>
  )
}
