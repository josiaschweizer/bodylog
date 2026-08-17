import type { ReactNode } from 'react'
import { Activity, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

type AuthLayoutProps = {
  children: ReactNode
  title: string
  description: string
  footer: ReactNode
}

export default function AuthLayout({
  children,
  title,
  description,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="grid min-h-svh bg-khaki-beige-50 lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.8fr)]">
      <section className="relative hidden overflow-hidden bg-chocolate-plum-900 p-12 text-khaki-beige-50 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-chocolate-plum-700/45 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-khaki-beige-500/20 blur-3xl" />

        <Link
          to="/"
          className="relative inline-flex w-fit items-center gap-3 text-xl font-bold tracking-tight"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-khaki-beige-100 text-chocolate-plum-800">
            <Activity size={24} strokeWidth={2.25} aria-hidden="true" />
          </span>
          BodyLog
        </Link>

        <div className="relative max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-khaki-beige-300">
            Dein Körper. Deine Daten.
          </p>
          <h2 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">
            Verstehe, was dir wirklich guttut.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-khaki-beige-200">
            Halte Gesundheit, Gewohnheiten und Wohlbefinden an einem geschützten Ort
            fest und erkenne Zusammenhänge im Alltag.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-sm text-khaki-beige-300">
          <ShieldCheck size={20} aria-hidden="true" />
          Deine Einträge sind nur für dich sichtbar.
        </div>
      </section>

      <section className="flex items-center justify-center px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-xl font-bold tracking-tight text-chocolate-plum-900 lg:hidden"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-chocolate-plum-800 text-khaki-beige-50">
              <Activity size={22} aria-hidden="true" />
            </span>
            BodyLog
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-chocolate-plum-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 leading-7 text-dusty-taupe-700">{description}</p>
          </div>

          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-dusty-taupe-700">{footer}</div>
        </div>
      </section>
    </main>
  )
}
