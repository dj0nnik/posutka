import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'

const optionalUrl = Yup.string()
  .transform((v) => (v === '' ? undefined : v))
  .url('Введите корректный URL')
  .optional()

const schema = Yup.object({
  title: Yup.string().required('Укажите название').max(120),
  addressShort: Yup.string().required('Укажите адрес').max(200),
  descriptionShort: Yup.string().required('Краткое описание').max(500),
  defaultNightPrice: Yup.number().min(0, 'Не отрицательное').required(),
  avito: optionalUrl,
  sutochno: optionalUrl,
  yandexTravel: optionalUrl,
})

export function ApartmentEdit() {
  const { id } = useParams()
  const isNew = !id
  const { user } = useAuth()
  const { apartments, createApartment, updateApartment } = useData()
  const navigate = useNavigate()

  const existing = useMemo(
    () => (!isNew && id ? apartments.find((a) => a.id === id) : undefined),
    [apartments, id, isNew]
  )

  if (!isNew && !existing) {
    return (
      <div>
        <p>Объект не найден</p>
        <Link to="/dashboard">Назад</Link>
      </div>
    )
  }

  const initial = {
    title: existing?.title ?? '',
    addressShort: existing?.addressShort ?? '',
    descriptionShort: existing?.descriptionShort ?? '',
    defaultNightPrice: existing?.defaultNightPrice ?? 3500,
    avito: existing?.links.avito ?? '',
    sutochno: existing?.links.sutochno ?? '',
    yandexTravel: existing?.links.yandexTravel ?? '',
  }

  return (
    <div>
      <Link to="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
        ← К объектам
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
        {isNew ? 'Новый объект' : 'Редактирование'}
      </h1>

      <Formik
        initialValues={initial}
        validationSchema={schema}
        enableReinitialize
        onSubmit={(values) => {
          if (!user) return
          if (isNew) {
            const apt = createApartment({
              title: values.title,
              addressShort: values.addressShort,
              descriptionShort: values.descriptionShort,
              defaultNightPrice: values.defaultNightPrice,
              links: {
                avito: values.avito ?? '',
                sutochno: values.sutochno ?? '',
                yandexTravel: values.yandexTravel ?? '',
              },
            })
            navigate(`/apartments/${apt.id}/calendar`)
          } else if (existing) {
            updateApartment(existing.id, {
              title: values.title,
              addressShort: values.addressShort,
              descriptionShort: values.descriptionShort,
              defaultNightPrice: values.defaultNightPrice,
              links: {
                avito: values.avito ?? '',
                sutochno: values.sutochno ?? '',
                yandexTravel: values.yandexTravel ?? '',
              },
            })
            navigate('/dashboard')
          }
        }}
      >
        <Form className="mt-8 max-w-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-800">Название</label>
            <Field
              name="title"
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
            />
            <ErrorMessage name="title" component="p" className="mt-1 text-sm text-red-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800">Адрес (кратко)</label>
            <Field
              name="addressShort"
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
            />
            <ErrorMessage name="addressShort" component="p" className="mt-1 text-sm text-red-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800">Описание (кратко)</label>
            <Field
              as="textarea"
              name="descriptionShort"
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
            />
            <ErrorMessage name="descriptionShort" component="p" className="mt-1 text-sm text-red-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              Базовая цена за ночь (₽)
            </label>
            <Field
              name="defaultNightPrice"
              type="number"
              className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
            />
            <ErrorMessage name="defaultNightPrice" component="p" className="mt-1 text-sm text-red-600" />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">Ссылки на площадки</p>
            <p className="mt-1 text-xs text-neutral-500">Авито, Суточно, Яндекс.Путешествия</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600">Авито</label>
                <Field
                  name="avito"
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                />
                <ErrorMessage name="avito" component="p" className="mt-1 text-xs text-red-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">Суточно</label>
                <Field
                  name="sutochno"
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                />
                <ErrorMessage name="sutochno" component="p" className="mt-1 text-xs text-red-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600">Яндекс.Путешествия</label>
                <Field
                  name="yandexTravel"
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                />
                <ErrorMessage name="yandexTravel" component="p" className="mt-1 text-xs text-red-600" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">{isNew ? 'Создать и открыть календарь' : 'Сохранить'}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Отмена
            </Button>
          </div>
        </Form>
      </Formik>
    </div>
  )
}
