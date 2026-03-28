import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'

const schema = Yup.object({
  displayName: Yup.string().max(80, 'Не длиннее 80 символов'),
  email: Yup.string().email('Введите корректный email').required('Обязательное поле'),
  password: Yup.string().min(6, 'Минимум 6 символов').required('Обязательное поле'),
})

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold text-neutral-900">Регистрация</h1>
      <p className="mt-2 text-neutral-600">Создайте аккаунт для управления объектами</p>

      <Formik
        initialValues={{ displayName: '', email: '', password: '' }}
        validationSchema={schema}
        onSubmit={async (values, { setFieldError }) => {
          try {
            await register(values.email, values.password, values.displayName)
            navigate('/dashboard', { replace: true })
          } catch (e) {
            setFieldError('email', e instanceof Error ? e.message : 'Ошибка')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="mt-8 space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-neutral-800">
                Имя
              </label>
              <Field
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Как к вам обращаться"
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorMessage name="displayName" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-800">
                Email
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-800">
                Пароль
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 outline-none focus:border-neutral-900"
              />
              <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? 'Создание…' : 'Зарегистрироваться'}
            </Button>
          </Form>
        )}
      </Formik>

      <p className="mt-8 text-center text-sm text-neutral-600">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold text-neutral-900 underline">
          Войти
        </Link>
      </p>
    </div>
  )
}
