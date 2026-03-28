import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { MAX_APARTMENTS_PER_USER } from '../types'

export function Dashboard() {
  const { apartments } = useData()
  const canAdd = apartments.length < MAX_APARTMENTS_PER_USER

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Ваши объекты</h1>
          <p className="mt-1 text-neutral-600">
            До {MAX_APARTMENTS_PER_USER} квартир в аккаунте. Управляйте ценами и календарём для каждой.
          </p>
        </div>
        {canAdd ? (
          <Link
            to="/apartments/new"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            Добавить объект
          </Link>
        ) : (
          <p className="text-sm text-neutral-500">Достигнут лимит объектов</p>
        )}
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {apartments.map((a) => (
          <li
            key={a.id}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-neutral-900">{a.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{a.addressShort}</p>
            <p className="mt-3 line-clamp-2 text-sm text-neutral-600">{a.descriptionShort}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={`/apartments/${a.id}/calendar`}
                className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
              >
                Календарь
              </Link>
              <Link
                to={`/apartments/${a.id}/edit`}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Редактировать
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {apartments.length === 0 && (
        <div className="mt-16 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <p className="text-neutral-600">Пока нет объектов. Добавьте первую квартиру.</p>
          {canAdd && (
            <Link
              to="/apartments/new"
              className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white"
            >
              Добавить объект
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
