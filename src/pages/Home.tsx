import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white">
            R
          </span>
          <span className="text-xl font-semibold tracking-tight">RentStay</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          >
            Войти
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            Регистрация
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-brand)]">
          Посуточная аренда
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
          Управляйте квартирами, ценами и календарём в одном месте
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-600">
          Минималистичный кабинет в духе Airbnb: шахматка бронирований, шаблоны цен, импорт и экспорт
          iCal для Авито, Суточно и Яндекс.Путешествий.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/register"
            className="rounded-full bg-[var(--color-brand)] px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
          >
            Начать бесплатно
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-neutral-300 bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 hover:border-neutral-400"
          >
            Уже есть аккаунт
          </Link>
        </div>
      </section>
    </div>
  )
}
