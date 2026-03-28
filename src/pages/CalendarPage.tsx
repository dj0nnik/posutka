import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useData } from '../contexts/DataContext'
import { BookingCalendar } from '../components/calendar/BookingCalendar'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { SOURCE_COLORS } from '../utils/calendarEvents'
import type { ExternalBookingSource } from '../types'

const sourceLabels: Record<ExternalBookingSource, string> = {
  avito: 'Авито',
  sutochno: 'Суточно',
  yandex: 'Яндекс',
  ical: 'iCal',
  other: 'Другое',
}

export function CalendarPage() {
  const { id } = useParams()
  const {
    apartments,
    getCalendar,
    toggleManualBlockRange,
    setNightPricesForRange,
    addPriceTemplate,
    removePriceTemplate,
    applyTemplateToRange,
    addIcalFeed,
    removeIcalFeed,
    refreshIcalFeed,
    exportIcs,
  } = useData()

  const apartment = apartments.find((a) => a.id === id)
  const calendar = id ? getCalendar(id) : null

  const [rangeModal, setRangeModal] = useState<{ start: Date; end: Date } | null>(null)
  const [templateModal, setTemplateModal] = useState(false)

  const refreshFeedsLoop = useCallback(() => {
    if (!id || !calendar) return
    for (const f of calendar.icalFeeds) {
      if (f.refreshIntervalMs > 0) {
        void refreshIcalFeed(id, f.id)
      }
    }
  }, [id, calendar, refreshIcalFeed])

  useEffect(() => {
    if (!calendar?.icalFeeds.length) return
    const timers = calendar.icalFeeds
      .filter((f) => f.refreshIntervalMs > 0)
      .map((f) =>
        window.setInterval(() => {
          if (id) void refreshIcalFeed(id, f.id)
        }, f.refreshIntervalMs)
      )
    return () => timers.forEach(clearInterval)
  }, [calendar?.icalFeeds, id, refreshIcalFeed])

  const onSelectRange = useCallback((start: Date, end: Date) => {
    setRangeModal({ start, end })
  }, [])

  const handleExport = () => {
    if (!id) return
    const blob = new Blob([exportIcs(id)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calendar-${id.slice(0, 8)}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const rangeLabel = useMemo(() => {
    if (!rangeModal) return ''
    return `${rangeModal.start.toLocaleDateString('ru-RU')} — ${rangeModal.end.toLocaleDateString('ru-RU')}`
  }, [rangeModal])

  if (!id || !apartment || !calendar) {
    return (
      <div>
        <p>Объект не найден</p>
        <Link to="/dashboard">Назад</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            ← К объектам
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{apartment.title}</h1>
          <p className="text-sm text-neutral-500">{apartment.addressShort}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/apartments/${apartment.id}/edit`}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:border-neutral-400"
          >
            Редактировать объект
          </Link>
          <Button type="button" variant="secondary" onClick={handleExport}>
            Экспорт .ics
          </Button>
          <Button type="button" variant="secondary" onClick={() => setTemplateModal(true)}>
            Шаблоны цен
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-600">
        <span className="font-semibold text-neutral-800">Легенда:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> свободно (цена в ячейке)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-400" /> закрыто вручную
        </span>
        {(['avito', 'sutochno', 'yandex', 'ical'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SOURCE_COLORS[k] }}
            />
            {sourceLabels[k]}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <BookingCalendar apartment={apartment} calendar={calendar} onSelectRange={onSelectRange} />
        <p className="mt-3 text-sm text-neutral-500">
          Выделите диапазон дней мышью, чтобы закрыть даты, задать цену или применить шаблон.
        </p>
      </div>

      <section className="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Импорт iCal (URL)</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Подключите ссылку на календарь с Авито, Суточно и др. Обновление по таймеру — если сайт
              отдаёт CORS, загрузка сработает; иначе понадобится прокси на сервере.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={refreshFeedsLoop}>
            Обновить все фиды
          </Button>
        </div>

        <Formik
          initialValues={{
            url: '',
            label: 'Авито',
            source: 'avito' as ExternalBookingSource,
            refreshIntervalMs: 3600000,
          }}
          validationSchema={Yup.object({
            url: Yup.string().url('Некорректный URL').required(),
            label: Yup.string().required(),
          })}
          onSubmit={(values, { resetForm }) => {
            addIcalFeed(apartment.id, {
              url: values.url,
              label: values.label,
              source: values.source,
              refreshIntervalMs: Number(values.refreshIntervalMs) || 0,
            })
            resetForm()
          }}
        >
          {({ isSubmitting }) => (
            <Form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-neutral-600">URL календаря (.ics)</label>
                <Field
                  name="url"
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">Подпись</label>
                <Field name="label" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">Источник</label>
                <Field as="select" name="source" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
                  {(Object.keys(sourceLabels) as ExternalBookingSource[]).map((k) => (
                    <option key={k} value={k}>
                      {sourceLabels[k]}
                    </option>
                  ))}
                </Field>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">Интервал (мс, 0 = вручную)</label>
                <Field
                  name="refreshIntervalMs"
                  type="number"
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  Добавить фид
                </Button>
              </div>
            </Form>
          )}
        </Formik>

        <ul className="mt-6 divide-y divide-neutral-100">
          {calendar.icalFeeds.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium text-neutral-900">{f.label}</p>
                <p className="break-all text-xs text-neutral-500">{f.url}</p>
                {f.lastError && <p className="text-xs text-red-600">Ошибка: {f.lastError}</p>}
                {f.lastFetchedAt && (
                  <p className="text-xs text-neutral-400">
                    Обновлено: {new Date(f.lastFetchedAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => refreshIcalFeed(apartment.id, f.id)}>
                  Обновить
                </Button>
                <Button type="button" variant="ghost" onClick={() => removeIcalFeed(apartment.id, f.id)}>
                  Удалить
                </Button>
              </div>
            </li>
          ))}
          {calendar.icalFeeds.length === 0 && (
            <li className="py-4 text-sm text-neutral-500">Фиды не подключены</li>
          )}
        </ul>
      </section>

      <Modal
        open={!!rangeModal}
        onClose={() => setRangeModal(null)}
        title={`Действие с датами: ${rangeLabel}`}
        wide
      >
        {rangeModal && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm font-semibold text-neutral-900">Закрыть для бронирования</p>
              <p className="mt-1 text-xs text-neutral-500">Пометить выбранные дни как недоступные</p>
              <Button
                className="mt-4 w-full"
                type="button"
                onClick={() => {
                  toggleManualBlockRange(apartment.id, rangeModal.start, rangeModal.end, true)
                  setRangeModal(null)
                }}
              >
                Закрыть диапазон
              </Button>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm font-semibold text-neutral-900">Открыть</p>
              <p className="mt-1 text-xs text-neutral-500">Снять ручную блокировку</p>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                type="button"
                onClick={() => {
                  toggleManualBlockRange(apartment.id, rangeModal.start, rangeModal.end, false)
                  setRangeModal(null)
                }}
              >
                Открыть диапазон
              </Button>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 sm:col-span-2">
              <Formik
                initialValues={{ price: apartment.defaultNightPrice }}
                onSubmit={(values) => {
                  setNightPricesForRange(apartment.id, rangeModal.start, rangeModal.end, values.price)
                  setRangeModal(null)
                }}
              >
                {() => (
                  <Form className="flex flex-wrap items-end gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Цена за ночь (₽)</p>
                      <Field
                        name="price"
                        type="number"
                        className="mt-2 w-40 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <Button type="submit">Применить к диапазону</Button>
                  </Form>
                )}
              </Formik>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-neutral-900">Применить шаблон</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {calendar.priceTemplates.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      applyTemplateToRange(apartment.id, t.id, rangeModal.start, rangeModal.end)
                      setRangeModal(null)
                    }}
                  >
                    {t.name} ({t.pricePerNight} ₽)
                  </Button>
                ))}
                {calendar.priceTemplates.length === 0 && (
                  <p className="text-sm text-neutral-500">Сначала создайте шаблоны (кнопка выше)</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={templateModal} onClose={() => setTemplateModal(false)} title="Шаблоны цен">
        <Formik
          initialValues={{
            name: 'Будни',
            kind: 'weekday' as const,
            pricePerNight: apartment.defaultNightPrice,
          }}
          validationSchema={Yup.object({
            name: Yup.string().required(),
            pricePerNight: Yup.number().min(0).required(),
          })}
          onSubmit={(values, { resetForm }) => {
            addPriceTemplate(apartment.id, {
              name: values.name,
              kind: values.kind,
              pricePerNight: values.pricePerNight,
            })
            resetForm()
          }}
        >
          <Form className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Field name="name" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Тип</label>
              <Field as="select" name="kind" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2">
                <option value="weekday">Будни</option>
                <option value="weekend">Выходные</option>
                <option value="holiday">Праздники</option>
                <option value="custom">Произвольный</option>
              </Field>
            </div>
            <div>
              <label className="text-sm font-medium">Цена за ночь (₽)</label>
              <Field
                name="pricePerNight"
                type="number"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
              />
            </div>
            <Button type="submit">Добавить шаблон</Button>
          </Form>
        </Formik>

        <ul className="mt-8 divide-y divide-neutral-100">
          {calendar.priceTemplates.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                {t.name} — {t.pricePerNight} ₽ / ночь ({t.kind})
              </span>
              <button
                type="button"
                className="text-red-600 hover:underline"
                onClick={() => removePriceTemplate(apartment.id, t.id)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
