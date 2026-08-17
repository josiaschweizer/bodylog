import { useEffect, useMemo, useState } from 'react'
import { Activity, CalendarRange, Gauge, Layers3, Pencil } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import ActivityBarChart from '@/components/charts/ActivityBarChart'
import type { AppOutletContext } from '@/components/layout/AppLayout'
import { getTrackingEntrySummary, getTrackingTypeLabel, TRACKING_TYPES } from '@/lib/tracking'
import type { TrackingEntry } from '@/lib/tracking'
import { getTrackingEntries } from '@/methods/tracking'

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export default function AnalyticsRoute() {
  const { refreshToken, openEditEntry } = useOutletContext<AppOutletContext>()
  const [entries, setEntries] = useState<TrackingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const to = startOfLocalDay()
    to.setDate(to.getDate() + 1)
    const from = startOfLocalDay()
    from.setDate(from.getDate() - 29)

    setIsLoading(true)
    setError(null)
    void getTrackingEntries(from, to)
      .then(setEntries)
      .catch(() => setError('Die Analytics-Daten konnten nicht geladen werden.'))
      .finally(() => setIsLoading(false))
  }, [refreshToken])

  const dailyCounts = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' })
    return Array.from({ length: 14 }, (_, index) => {
      const date = startOfLocalDay()
      date.setDate(date.getDate() - (13 - index))
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      return {
        label: formatter.format(date),
        value: entries.filter((entry) => {
          const time = new Date(entry.occurred_at).getTime()
          return time >= date.getTime() && time < nextDate.getTime()
        }).length,
      }
    })
  }, [entries])

  const categoryData = TRACKING_TYPES.map((type) => ({
    type: type.value,
    label: getTrackingTypeLabel(type.value),
    value: entries.filter((entry) => entry.entry_type === type.value).length,
  }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const maxCategoryValue = Math.max(...categoryData.map((item) => item.value), 1)
  const activeDays = new Set(entries.map((entry) => new Date(entry.occurred_at).toLocaleDateString('de-CH'))).size
  const averagePerActiveDay = activeDays ? (entries.length / activeDays).toFixed(1) : '0'

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-36 pt-7 sm:px-8 lg:px-10 lg:pb-10 lg:pt-10">
      <header>
        <p className="text-sm font-semibold text-chocolate-plum-600">Letzte 30 Tage</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-chocolate-plum-950 sm:text-4xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-dusty-taupe-600">
          Erkenne deine Aktivität und die Verteilung deiner protokollierten Ereignisse.
        </p>
      </header>

      {error ? (
        <p className="mt-6 rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800" role="alert">{error}</p>
      ) : null}

      <section className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:grid-cols-4" aria-label="Analytics-Kennzahlen">
        {[
          { label: 'Einträge', value: isLoading ? '–' : entries.length, icon: Activity },
          { label: 'Aktive Tage', value: isLoading ? '–' : activeDays, icon: CalendarRange },
          { label: 'Ø pro aktivem Tag', value: isLoading ? '–' : averagePerActiveDay, icon: Gauge },
          { label: 'Genutzte Kategorien', value: isLoading ? '–' : categoryData.length, icon: Layers3 },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-dusty-taupe-600">{label}</p>
              <Icon className="text-chocolate-plum-500" size={20} aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-chocolate-plum-950 sm:mt-3 sm:text-3xl">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-chocolate-plum-950">Aktivität im Verlauf</h2>
          <p className="mt-1 text-sm text-dusty-taupe-600">Die letzten 14 Tage im direkten Vergleich</p>
          <div className="scrollbar-hidden -mx-5 mt-5 touch-pan-x overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6">
            <div className="min-w-[42rem]"><ActivityBarChart data={dailyCounts} /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-chocolate-plum-950">Kategorien</h2>
          <p className="mt-1 text-sm text-dusty-taupe-600">Verteilung der letzten 30 Tage</p>
          <div className="mt-6 space-y-5">
            {categoryData.length === 0 && !isLoading ? (
              <p className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center text-sm text-dusty-taupe-600">Noch keine Daten vorhanden.</p>
            ) : (
              categoryData.map((item) => (
                <div key={item.type}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-ash-brown-800">{item.label}</span>
                    <span className="font-semibold text-chocolate-plum-700">{item.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-dusty-taupe-100">
                    <div className="h-full rounded-full bg-chocolate-plum-600" style={{ width: `${(item.value / maxCategoryValue) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-chocolate-plum-950">Einträge der letzten 30 Tage</h2>
            <p className="mt-1 text-sm text-dusty-taupe-600">Verlauf ansehen und bestehende Einträge bearbeiten</p>
          </div>
          <span className="rounded-full bg-khaki-beige-100 px-3 py-1 text-xs font-bold text-khaki-beige-800">{entries.length}</span>
        </div>

        <div className="mt-5 divide-y divide-dusty-taupe-100">
          {!isLoading && entries.length === 0 ? (
            <p className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center text-sm text-dusty-taupe-600">Noch keine Einträge vorhanden.</p>
          ) : null}
          {entries.map((entry) => (
            <article key={entry.id} className="flex items-start gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center gap-3">
                    <div className="size-2.5 shrink-0 rounded-full bg-chocolate-plum-500" />
                    <p className="font-semibold text-ash-brown-900">{getTrackingTypeLabel(entry.entry_type)}</p>
                  </div>
                  <time className="text-xs text-dusty-taupe-500">
                    {new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.occurred_at))}
                  </time>
                </div>
                {getTrackingEntrySummary(entry) ? <p className="mt-1 pl-[1.375rem] text-sm text-dusty-taupe-600">{getTrackingEntrySummary(entry)}</p> : null}
              </div>
              <button type="button" onClick={() => openEditEntry(entry)} className="grid size-11 shrink-0 place-items-center rounded-xl text-dusty-taupe-500 transition hover:bg-chocolate-plum-100 hover:text-chocolate-plum-700 active:bg-chocolate-plum-200" aria-label={`${getTrackingTypeLabel(entry.entry_type)} bearbeiten`}>
                <Pencil size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
