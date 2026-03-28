import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'

const schema = Yup.object({
  displayName: Yup.string().max(80).required('Укажите имя'),
})

export function Profile() {
  const { user, updateProfile } = useAuth()
  if (!user) return null

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Личный кабинет</h1>
      <p className="mt-1 text-neutral-600">Данные профиля и аккаунта</p>

      <div className="mt-10 max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</p>
        <p className="mt-1 text-neutral-900">{user.email}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Дата регистрации
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          {new Date(user.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        <Formik
          initialValues={{ displayName: user.displayName }}
          validationSchema={schema}
          enableReinitialize
          onSubmit={(values, { setStatus }) => {
            updateProfile(values.displayName)
            setStatus({ ok: true })
            setTimeout(() => setStatus(undefined), 2000)
          }}
        >
          {({ status }) => (
            <Form className="mt-8 space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-neutral-800">
                  Отображаемое имя
                </label>
                <Field
                  id="displayName"
                  name="displayName"
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>
              {status?.ok && <p className="text-sm text-emerald-600">Сохранено</p>}
              <Button type="submit">Сохранить</Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
