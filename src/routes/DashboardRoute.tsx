import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, Layers3, Pencil, Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AppOutletContext } from '@/components/layout/AppLayout'
import { useAuth } from '@/lib/auth-context'
import { getTrackingEntrySummary, getTrackingTypeLabel } from '@/lib/tracking'
import type { TrackingEntry } from '@/lib/tracking'
import { getTrackingEntries } from '@/methods/tracking'

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export default function DashboardRoute() {
  const { user } = useAuth()
  const { refreshToken, openNewEntry, openEditEntry } = useOutletContext<AppOutletContext>()
  const [entries, setEntries] = useState<TrackingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = startOfLocalDay()
    const to = new Date(today)
    to.setDate(to.getDate() + 1)

    setIsLoading(true)
    setError(null)
    void getTrackingEntries(today, to)
      .then(setEntries)
      .catch(() => setError('Die Dashboard-Daten konnten nicht geladen werden.'))
      .finally(() => setIsLoading(false))
  }, [refreshToken])

  const todayEntries = entries
  const categoryCount = new Set(todayEntries.map((entry) => entry.entry_type)).size
  const firstName = user?.user_metadata.first_name as string | undefined

  const categoryData = Array.from(new Set(todayEntries.map((entry) => entry.entry_type))).map(
    (entryType) => ({
      entryType,
      label: getTrackingTypeLabel(entryType),
      count: todayEntries.filter((entry) => entry.entry_type === entryType).length,
    }),
  )

  const greeting = new Date().getHours() < 12 ? 'Guten Morgen' : new Date().getHours() < 18 ? 'Guten Tag' : 'Guten Abend'

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-7 sm:px-8 lg:px-10 lg:pb-10 lg:pt-10">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-chocolate-plum-600">Heute im Überblick</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-chocolate-plum-950 sm:text-4xl">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-dusty-taupe-600">
            {new Intl.DateTimeFormat('de-CH', { dateStyle: 'full' }).format(new Date())}
          </p>
        </div>
        <button
          type="button"
          onClick={openNewEntry}
          className="hidden items-center gap-2 rounded-xl border border-dusty-taupe-300 bg-white px-4 py-2.5 text-sm font-semibold text-ash-brown-800 transition hover:bg-dusty-taupe-100 sm:flex lg:hidden"
        >
          <Plus size={18} aria-hidden="true" />
          Neuer Eintrag
        </button>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800" role="alert">{error}</p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Tageskennzahlen">
        {[
          { label: 'Einträge heute', value: isLoading ? '–' : todayEntries.length, icon: CalendarDays },
          { label: 'Kategorien', value: isLoading ? '–' : categoryCount, icon: Layers3 },
          {
            label: 'Letzter Eintrag',
            value: isLoading || !todayEntries[0] ? '–' : new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' }).format(new Date(todayEntries[0].occurred_at)),
            icon: Clock3,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-dusty-taupe-600">{label}</p>
              <Icon className="text-chocolate-plum-500" size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold text-chocolate-plum-950">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-chocolate-plum-950">Kategorien heute</h2>
            <p className="mt-1 text-sm text-dusty-taupe-600">Verteilung deiner heutigen Aktivitäten</p>
          </div>
          <div className="mt-5 space-y-3">
            {categoryData.length === 0 && !isLoading ? (
              <p className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center text-sm text-dusty-taupe-600">Noch keine Daten vorhanden.</p>
            ) : (
              categoryData.map((category) => (
                <div key={category.entryType} className="flex items-center justify-between rounded-xl bg-khaki-beige-50 px-4 py-3">
                  <span className="font-medium text-ash-brown-800">{category.label}</span>
                  <span className="grid size-8 place-items-center rounded-full bg-chocolate-plum-100 text-sm font-bold text-chocolate-plum-800">{category.count}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-chocolate-plum-950">Tagesverlauf</h2>
              <p className="mt-1 text-sm text-dusty-taupe-600">Alle Aktivitäten von heute</p>
            </div>
            <span className="rounded-full bg-khaki-beige-100 px-3 py-1 text-xs font-semibold text-khaki-beige-700">{todayEntries.length}</span>
          </div>

          <div className="mt-5 space-y-1">
            {!isLoading && todayEntries.length === 0 ? (
              <div className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center">
                <p className="font-medium text-ash-brown-800">Noch keine Einträge heute</p>
                <button type="button" onClick={openNewEntry} className="mt-2 text-sm font-semibold text-chocolate-plum-700">Ersten Eintrag erfassen</button>
              </div>
            ) : (
              todayEntries.map((entry) => (
                <article key={entry.id} className="border-b border-dusty-taupe-100 py-4 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="size-2.5 shrink-0 rounded-full bg-chocolate-plum-500" />
                        <p className="font-semibold text-ash-brown-900">{getTrackingTypeLabel(entry.entry_type)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <time className="shrink-0 text-xs font-medium text-dusty-taupe-500">
                          {new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.occurred_at))}
                        </time>
                        <button type="button" onClick={() => openEditEntry(entry)} className="grid size-8 place-items-center rounded-lg text-dusty-taupe-500 transition hover:bg-chocolate-plum-100 hover:text-chocolate-plum-700" aria-label={`${getTrackingTypeLabel(entry.entry_type)} bearbeiten`}>
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {getTrackingEntrySummary(entry) ? (
                      <p className="mt-1 line-clamp-2 pl-[1.375rem] text-sm text-dusty-taupe-600">
                        {getTrackingEntrySummary(entry)}
                      </p>
                    ) : null}
                    {entry.note && entry.note !== getTrackingEntrySummary(entry) ? (
                      <p className="ml-[1.375rem] mt-2 rounded-lg bg-khaki-beige-50 px-3 py-2 text-sm text-dusty-taupe-700">{entry.note}</p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
