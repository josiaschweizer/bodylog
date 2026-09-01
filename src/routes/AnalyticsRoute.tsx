import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  Download,
  HeartPulse,
  ListChecks,
  Moon,
  Pencil,
  Printer,
  Stethoscope,
  Utensils,
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import ActivityBarChart from '@/components/charts/ActivityBarChart'
import TrendLineChart from '@/components/charts/TrendLineChart'
import type { AppOutletContext } from '@/components/layout/AppLayout'
import {
  getTrackingEntrySummary,
  getTrackingTypeLabel,
  MEAL_TYPES,
  TRACKING_TYPES,
  type StoolConsistency,
  type TrackingEntry,
  type TrackingEntryType,
} from '@/lib/tracking'
import { getTrackingEntries } from '@/methods/tracking'

type PeriodDays = 7 | 30 | 90
type MetricKey = 'bloodPressure' | 'pulse' | 'temperature' | 'weight'
type StoolChartMode = 'consistency' | 'combined'

const metricOptions: Array<{
  key: MetricKey
  label: string
  unit: string
  color: string
  secondaryColor?: string
}> = [
  {
    key: 'bloodPressure',
    label: 'Blutdruck',
    unit: 'mmHg',
    color: '#7a5452',
    secondaryColor: '#b6957c',
  },
  { key: 'pulse', label: 'Puls', unit: 'bpm', color: '#80596e' },
  { key: 'temperature', label: 'Temperatur', unit: '°C', color: '#a56b45' },
  { key: 'weight', label: 'Gewicht', unit: 'kg', color: '#55736b' },
]

const categoryColors: Record<TrackingEntryType, string> = {
  FOOD: 'bg-[#b6815c]',
  DRINK: 'bg-[#668a95]',
  MEDICATION: 'bg-[#7d6b99]',
  SYMPTOM: 'bg-[#a95555]',
  STOOL: 'bg-[#8b7359]',
  URINATION: 'bg-[#b59a54]',
  BODY_MEASUREMENT: 'bg-[#55736b]',
  SLEEP: 'bg-[#657196]',
  OTHER: 'bg-dusty-taupe-500',
}

const consistencyBristolValue: Record<StoolConsistency, number> = {
  VERY_HARD: 1,
  HARD: 2,
  NORMAL: 4,
  SOFT: 5,
  DIARRHEA: 6,
  WATERY_DIARRHEA: 7,
}

const foodTermStopWords = new Set([
  'auf',
  'aus',
  'bei',
  'das',
  'dem',
  'den',
  'der',
  'die',
  'ein',
  'eine',
  'einem',
  'einen',
  'einer',
  'für',
  'gemischt',
  'gemischter',
  'gross',
  'klein',
  'mit',
  'ohne',
  'portion',
  'scheibe',
  'stück',
  'tasse',
  'teller',
  'und',
  'vom',
  'von',
  'zum',
  'zur',
])

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDecimal(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits }).format(value)
}

function buildFrequency(values: string[]) {
  const frequencies = new Map<string, { label: string; count: number }>()
  values.forEach((value) => {
    const label = value.trim()
    const key = label.toLocaleLowerCase('de-CH')
    if (!key) {
      return
    }
    const current = frequencies.get(key)
    frequencies.set(key, { label: current?.label ?? label, count: (current?.count ?? 0) + 1 })
  })
  return [...frequencies.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'de-CH'),
  )
}

function extractFoodTerms(foodNames: string[]) {
  return foodNames.flatMap((name) =>
    name
      .toLocaleLowerCase('de-CH')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((term) => term.length >= 3 && !foodTermStopWords.has(term) && !/^\d+$/.test(term)),
  )
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function getSleepDuration(entry: TrackingEntry) {
  if (!entry.sleep_entries?.sleep_started_at || !entry.sleep_entries.sleep_ended_at) {
    return null
  }
  return (
    (new Date(entry.sleep_entries.sleep_ended_at).getTime() -
      new Date(entry.sleep_entries.sleep_started_at).getTime()) /
    3_600_000
  )
}

function getFlaggedEvents(entries: TrackingEntry[]) {
  return entries.flatMap((entry) => {
    const flags: string[] = []
    const stool = entry.stool_entries
    const urination = entry.urination_entries
    const symptom = entry.symptom_entries
    const measurement = entry.body_measurements

    if (stool?.blood) {
      flags.push('Blut beim Stuhlgang dokumentiert')
    }
    if (stool?.mucus) {
      flags.push('Schleim beim Stuhlgang dokumentiert')
    }
    if ((stool?.pain_level ?? 0) >= 7) {
      flags.push(`Starke Schmerzen beim Stuhlgang (${stool?.pain_level}/10)`)
    }
    if (urination?.burning) {
      flags.push('Brennen beim Wasserlassen dokumentiert')
    }
    if ((urination?.pain_level ?? 0) >= 7) {
      flags.push(`Starke Schmerzen beim Wasserlassen (${urination?.pain_level}/10)`)
    }
    if ((symptom?.severity ?? 0) >= 7) {
      const name = symptom?.symptoms?.name ?? symptom?.custom_name ?? 'Symptom'
      flags.push(`${name}: hohe Stärke (${symptom?.severity}/10)`)
    }
    if ((measurement?.temperature_celsius ?? 0) >= 38) {
      flags.push(`Erhöhte Temperatur (${measurement?.temperature_celsius} °C)`)
    }
    if (
      (measurement?.systolic_blood_pressure ?? 0) >= 140 ||
      (measurement?.diastolic_blood_pressure ?? 0) >= 90
    ) {
      flags.push(
        `Blutdruck ${measurement?.systolic_blood_pressure}/${measurement?.diastolic_blood_pressure} mmHg`,
      )
    }

    return flags.map((label) => ({ entry, label }))
  })
}

export default function AnalyticsRoute() {
  const { refreshToken, openEditEntry } = useOutletContext<AppOutletContext>()
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('bloodPressure')
  const [stoolChartMode, setStoolChartMode] = useState<StoolChartMode>('consistency')
  const [entryFilter, setEntryFilter] = useState<'ALL' | TrackingEntryType>('ALL')
  const [entries, setEntries] = useState<TrackingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const to = startOfLocalDay()
    to.setDate(to.getDate() + 1)
    const from = startOfLocalDay()
    from.setDate(from.getDate() - (periodDays - 1))

    setIsLoading(true)
    setError(null)
    void getTrackingEntries(from, to)
      .then(setEntries)
      .catch(() => setError('Die Auswertungsdaten konnten nicht geladen werden.'))
      .finally(() => setIsLoading(false))
  }, [periodDays, refreshToken])

  const analysis = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' })
    const from = startOfLocalDay()
    from.setDate(from.getDate() - (periodDays - 1))
    const bucketSize = periodDays === 90 ? 7 : periodDays === 30 ? 3 : 1
    const buckets = Array.from({ length: Math.ceil(periodDays / bucketSize) }, (_, index) => {
      const start = new Date(from)
      start.setDate(start.getDate() + index * bucketSize)
      const end = new Date(start)
      end.setDate(end.getDate() + bucketSize)
      const bucketEntries = entries.filter((entry) => {
        const time = new Date(entry.occurred_at).getTime()
        return time >= start.getTime() && time < end.getTime()
      })
      const symptomSeverities = bucketEntries
        .map((entry) => entry.symptom_entries?.severity)
        .filter((value): value is number => value !== null && value !== undefined)

      return {
        label: formatter.format(start),
        value: bucketEntries.length,
        symptomAverage: symptomSeverities.length
          ? symptomSeverities.reduce((sum, value) => sum + value, 0) / symptomSeverities.length
          : null,
      }
    })

    const symptomEntries = entries.filter((entry) => entry.symptom_entries)
    const symptomSeverities = symptomEntries.map((entry) => entry.symptom_entries!.severity)
    const sleepDurations = entries
      .map(getSleepDuration)
      .filter((value): value is number => value !== null)
    const symptomDays = new Set(
      symptomEntries.map((entry) => localDateKey(new Date(entry.occurred_at))),
    ).size
    const activeDays = new Set(entries.map((entry) => localDateKey(new Date(entry.occurred_at))))
      .size
    const flaggedEvents = getFlaggedEvents(entries)
    const chronologicalEntries = entries
      .slice()
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
    const stoolTrend = chronologicalEntries
      .filter((entry) => entry.stool_entries)
      .map((entry) => ({
        label: new Intl.DateTimeFormat('de-CH', {
          day: '2-digit',
          month: '2-digit',
        }).format(new Date(entry.occurred_at)),
        value: entry.stool_entries?.bristol_scale ?? null,
        secondaryValue: entry.stool_entries?.consistency
          ? consistencyBristolValue[entry.stool_entries.consistency]
          : null,
      }))
    const recordedBristolValues = stoolTrend
      .map((point) => point.value)
      .filter((value): value is number => value !== null)
    const consistencyValues = stoolTrend
      .map((point) => point.secondaryValue)
      .filter((value): value is number => value !== null)
    const foodEntries = entries.filter((entry) => entry.food_entries)
    const foodNames = foodEntries.flatMap((entry) =>
      entry
        .food_entries!.food_entry_items.map((item) => item.custom_name?.trim())
        .filter((name): name is string => Boolean(name)),
    )
    const mealTypeFrequency = buildFrequency(
      foodEntries.map(
        (entry) =>
          MEAL_TYPES.find((type) => type.value === entry.food_entries?.meal_type)?.label ??
          'Andere Mahlzeit',
      ),
    )

    return {
      buckets,
      symptomEntries,
      symptomDays,
      activeDays,
      flaggedEvents,
      stoolTrend,
      recordedBristolCount: recordedBristolValues.length,
      averageConsistencyValue: consistencyValues.length
        ? consistencyValues.reduce((sum, value) => sum + value, 0) / consistencyValues.length
        : null,
      stoolBreakdown: {
        hard: consistencyValues.filter((value) => value <= 2).length,
        normal: consistencyValues.filter((value) => value >= 3 && value <= 4).length,
        loose: consistencyValues.filter((value) => value >= 5).length,
        recorded: consistencyValues.length,
      },
      foodItemCount: foodNames.length,
      foodFrequency: buildFrequency(foodNames).slice(0, 8),
      foodTermFrequency: buildFrequency(extractFoodTerms(foodNames)).slice(0, 12),
      mealTypeFrequency,
      averageSeverity: symptomSeverities.length
        ? symptomSeverities.reduce((sum, value) => sum + value, 0) / symptomSeverities.length
        : null,
      averageSleep: sleepDurations.length
        ? sleepDurations.reduce((sum, value) => sum + value, 0) / sleepDurations.length
        : null,
    }
  }, [entries, periodDays])

  const categoryData = TRACKING_TYPES.map((type) => ({
    type: type.value,
    label: getTrackingTypeLabel(type.value),
    value: entries.filter((entry) => entry.entry_type === type.value).length,
  }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const metricData = useMemo(() => {
    return entries
      .filter((entry) => entry.body_measurements)
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .map((entry) => {
        const measurement = entry.body_measurements!
        let value: number | null = null
        let secondaryValue: number | null = null
        if (selectedMetric === 'bloodPressure') {
          value = measurement.systolic_blood_pressure
          secondaryValue = measurement.diastolic_blood_pressure
        } else if (selectedMetric === 'pulse') {
          value = measurement.pulse_bpm
        } else if (selectedMetric === 'temperature') {
          value = measurement.temperature_celsius
        } else {
          value = measurement.weight_kg
        }
        return {
          label: new Intl.DateTimeFormat('de-CH', {
            day: '2-digit',
            month: '2-digit',
          }).format(new Date(entry.occurred_at)),
          value,
          secondaryValue,
        }
      })
      .filter((point) => point.value !== null)
  }, [entries, selectedMetric])

  const selectedMetricOption = metricOptions.find((option) => option.key === selectedMetric)!
  const filteredEntries = entries.filter(
    (entry) => entryFilter === 'ALL' || entry.entry_type === entryFilter,
  )

  const periodStart = startOfLocalDay()
  periodStart.setDate(periodStart.getDate() - (periodDays - 1))
  const periodLabel = `${new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' }).format(periodStart)} – ${new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' }).format(new Date())}`

  function exportCsv() {
    const rows = [
      ['Datum', 'Zeit', 'Kategorie', 'Details', 'Notiz'],
      ...entries
        .slice()
        .reverse()
        .map((entry) => {
          const date = new Date(entry.occurred_at)
          return [
            new Intl.DateTimeFormat('de-CH').format(date),
            new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' }).format(date),
            getTrackingTypeLabel(entry.entry_type),
            getTrackingEntrySummary(entry) ?? '',
            entry.note ?? '',
          ]
        }),
    ]
    const content = `\ufeff${rows.map((row) => row.map(csvCell).join(';')).join('\n')}`
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `bodylog-auswertung-${localDateKey(new Date())}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto w-full max-w-[92rem] px-4 pb-36 pt-5 sm:px-7 sm:pt-8 lg:px-8 lg:pb-12 xl:px-10 print:max-w-none print:bg-white print:p-0">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-chocolate-plum-600">
            <Stethoscope size={17} aria-hidden="true" />
            Arztbericht · {periodLabel}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-chocolate-plum-950 sm:text-4xl">
            Gesundheitsauswertung
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={exportCsv}
            disabled={entries.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dusty-taupe-300 bg-white px-3.5 text-sm font-semibold text-ash-brown-800 transition hover:bg-dusty-taupe-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-chocolate-plum-800 px-4 text-sm font-semibold text-white transition hover:bg-chocolate-plum-900"
          >
            <Printer size={17} aria-hidden="true" />
            Arztansicht drucken
          </button>
        </div>
      </header>

      <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-dusty-taupe-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4 print:hidden">
        <div className="flex items-center gap-2 text-sm font-semibold text-ash-brown-800">
          <CalendarRange size={18} className="text-chocolate-plum-600" aria-hidden="true" />
          Auswertungszeitraum
        </div>
        <div
          className="grid grid-cols-3 rounded-xl bg-khaki-beige-50 p-1"
          aria-label="Zeitraum wählen"
        >
          {([7, 30, 90] as PeriodDays[]).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriodDays(days)}
              className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition sm:px-5 ${
                periodDays === days
                  ? 'bg-white text-chocolate-plum-900 shadow-sm ring-1 ring-dusty-taupe-200'
                  : 'text-dusty-taupe-600 hover:text-ash-brown-900'
              }`}
              aria-pressed={periodDays === days}
            >
              {days} Tage
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p
          className="mt-5 rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section
        className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Wichtige Kennzahlen"
      >
        {[
          {
            label: 'Dokumentierte Tage',
            value: isLoading ? '–' : `${analysis.activeDays} / ${periodDays}`,
            icon: Activity,
          },
          {
            label: 'Tage mit Symptomen',
            value: isLoading ? '–' : analysis.symptomDays,
            icon: HeartPulse,
          },
          {
            label: 'Ø Schlafdauer',
            value:
              isLoading || analysis.averageSleep === null
                ? '–'
                : `${formatDecimal(analysis.averageSleep)} h`,
            icon: Moon,
          },
          {
            label: 'Zu besprechen',
            value: isLoading ? '–' : analysis.flaggedEvents.length,
            icon: AlertTriangle,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="min-w-0 rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold leading-5 text-dusty-taupe-600 sm:text-sm">
                {label}
              </p>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-chocolate-plum-50 text-chocolate-plum-600">
                <Icon size={17} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-chocolate-plum-950 sm:text-3xl">
              {value}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-chocolate-plum-950">Aktivität im Verlauf</h2>
            </div>
            <span className="mt-2 w-fit rounded-full bg-khaki-beige-100 px-3 py-1 text-xs font-semibold text-khaki-beige-800 sm:mt-0">
              {entries.length} gesamt
            </span>
          </div>
          <div className="mt-3">
            <ActivityBarChart data={analysis.buckets} />
          </div>
        </section>

        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-chocolate-plum-950">Erfasste Bereiche</h2>
          <div className="mt-4 space-y-4">
            {!isLoading && categoryData.length === 0 ? (
              <p className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center text-sm text-dusty-taupe-600">
                Noch keine Daten in diesem Zeitraum.
              </p>
            ) : (
              categoryData.map((item) => {
                const percentage = entries.length ? (item.value / entries.length) * 100 : 0
                return (
                  <div key={item.type}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 font-medium text-ash-brown-800">
                        <span
                          className={`size-2.5 shrink-0 rounded-full ${categoryColors[item.type]}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-chocolate-plum-700">
                        {item.value} · {Math.round(percentage)} %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-dusty-taupe-100">
                      <div
                        className={`h-full rounded-full ${categoryColors[item.type]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-chocolate-plum-950">Symptomstärke</h2>
          </div>
          <div className="mt-4">
            <TrendLineChart
              data={analysis.buckets.map((bucket) => ({
                label: bucket.label,
                value: bucket.symptomAverage,
              }))}
              ariaLabel="Verlauf der durchschnittlichen Symptomstärke"
              domain={[0, 10]}
              valueLabel={(value) => formatDecimal(value)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-chocolate-plum-950">Körperwerte</h2>
            </div>
            <label className="print:hidden">
              <span className="sr-only">Messwert wählen</span>
              <select
                value={selectedMetric}
                onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
                className="min-h-11 w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 text-sm font-semibold text-ash-brown-800 outline-none focus:border-chocolate-plum-500 sm:w-auto"
              >
                {metricOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4">
            <TrendLineChart
              data={metricData}
              ariaLabel={`Verlauf: ${selectedMetricOption.label}`}
              color={selectedMetricOption.color}
              secondaryColor={selectedMetricOption.secondaryColor}
              valueLabel={(value) => formatDecimal(value)}
            />
          </div>
          {selectedMetric === 'bloodPressure' && metricData.length ? (
            <div className="mt-1 flex flex-wrap gap-4 text-xs font-medium text-dusty-taupe-600">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-chocolate-plum-600" /> Systolisch
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 border-t-2 border-dashed border-khaki-beige-500" /> Diastolisch
              </span>
              <span>{selectedMetricOption.unit}</span>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#e7c7b8] bg-[#fffaf7] p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ddd2] text-[#8e493d]">
            <AlertTriangle size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-chocolate-plum-950">Für das Arztgespräch</h2>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#edd9cf] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="font-bold text-chocolate-plum-950">Verdauungsverlauf</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto">
              {[
                {
                  label: 'Ø Skalenwert',
                  value:
                    analysis.averageConsistencyValue === null
                      ? '–'
                      : formatDecimal(analysis.averageConsistencyValue),
                },
                { label: 'Hart · 1–2', value: analysis.stoolBreakdown.hard },
                { label: 'Normal · 3–4', value: analysis.stoolBreakdown.normal },
                { label: 'Weich · 5–7', value: analysis.stoolBreakdown.loose },
              ].map((item) => (
                <div
                  key={item.label}
                  className="min-w-24 rounded-xl bg-khaki-beige-50 px-3 py-2.5 text-center"
                >
                  <p className="text-lg font-bold text-chocolate-plum-950">{item.value}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-dusty-taupe-600">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div
              className="grid grid-cols-2 rounded-xl bg-khaki-beige-50 p-1"
              aria-label="Datengrundlage des Verdauungsverlaufs"
            >
              <button
                type="button"
                onClick={() => setStoolChartMode('consistency')}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition sm:text-sm ${
                  stoolChartMode === 'consistency'
                    ? 'bg-white text-chocolate-plum-900 shadow-sm ring-1 ring-dusty-taupe-200'
                    : 'text-dusty-taupe-600 hover:text-ash-brown-900'
                }`}
                aria-pressed={stoolChartMode === 'consistency'}
              >
                Nur Konsistenz
              </button>
              <button
                type="button"
                onClick={() => setStoolChartMode('combined')}
                disabled={analysis.recordedBristolCount === 0}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition sm:text-sm ${
                  stoolChartMode === 'combined'
                    ? 'bg-white text-chocolate-plum-900 shadow-sm ring-1 ring-dusty-taupe-200'
                    : 'text-dusty-taupe-600 hover:text-ash-brown-900 disabled:cursor-not-allowed disabled:opacity-40'
                }`}
                aria-pressed={stoolChartMode === 'combined'}
              >
                + Bristol-Werte
              </button>
            </div>
          </div>

          <div className="mt-4">
            <TrendLineChart
              data={analysis.stoolTrend.map((point) => ({
                label: point.label,
                value: point.secondaryValue,
                secondaryValue: stoolChartMode === 'combined' ? point.value : null,
              }))}
              ariaLabel={
                stoolChartMode === 'combined'
                  ? 'Stuhlverlauf nach Konsistenz und eingetragenen Bristol-Werten'
                  : 'Stuhlverlauf nach Konsistenz'
              }
              color="#7a5452"
              secondaryColor="#b6957c"
              domain={[1, 7]}
              tickValues={[7, 6, 5, 4, 3, 2, 1]}
              referenceBand={{ from: 3, to: 4, label: 'Normalbereich' }}
              valueLabel={(value) => formatDecimal(value, 0)}
            />
          </div>
          {analysis.stoolTrend.length ? (
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-dusty-taupe-600">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-chocolate-plum-600" /> Konsistenz auf Skala
              </span>
              {stoolChartMode === 'combined' ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 border-t-2 border-dashed border-khaki-beige-500" />
                  Eingetragener Bristol-Wert
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <h3 className="font-bold text-chocolate-plum-950">Markierte Beobachtungen</h3>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {!isLoading && analysis.flaggedEvents.length === 0 ? (
            <p className="rounded-xl border border-[#edd9cf] bg-white px-4 py-5 text-sm text-dusty-taupe-600 lg:col-span-2">
              In diesem Zeitraum wurden keine der automatisch geprüften Beobachtungen markiert.
            </p>
          ) : (
            analysis.flaggedEvents.slice(0, 8).map(({ entry, label }, index) => (
              <button
                key={`${entry.id}-${label}-${index}`}
                type="button"
                onClick={() => openEditEntry(entry)}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-[#edd9cf] bg-white px-4 py-3 text-left transition hover:border-[#d6a99a] print:pointer-events-none"
              >
                <span className="size-2 shrink-0 rounded-full bg-[#a95555]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ash-brown-900">{label}</span>
                  <time className="mt-0.5 block text-xs text-dusty-taupe-500">
                    {new Intl.DateTimeFormat('de-CH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(entry.occurred_at))}
                  </time>
                </span>
                <Pencil
                  size={15}
                  className="shrink-0 text-dusty-taupe-400 print:hidden"
                  aria-hidden="true"
                />
              </button>
            ))
          )}
        </div>
        {analysis.flaggedEvents.length > 8 ? (
          <p className="mt-3 text-xs font-medium text-dusty-taupe-600">
            + {analysis.flaggedEvents.length - 8} weitere markierte Beobachtungen im Protokoll
          </p>
        ) : null}
      </section>

      <section className="mt-5 rounded-2xl border border-[#d8c9ba] bg-[#fffdf9] p-4 shadow-sm sm:p-6 print:hidden">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eee4d6] text-[#755b3e]">
            <Utensils size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-chocolate-plum-950">Ernährung</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <article className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-chocolate-plum-950">Am häufigsten gegessen</h3>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-khaki-beige-50 text-khaki-beige-700">
                <ListChecks size={18} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {!isLoading && analysis.foodFrequency.length === 0 ? (
                <p className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center text-sm text-dusty-taupe-600">
                  Noch keine Lebensmittel in diesem Zeitraum erfasst.
                </p>
              ) : (
                analysis.foodFrequency.map((food, index) => {
                  const maximum = analysis.foodFrequency[0]?.count ?? 1
                  return (
                    <div key={food.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-ash-brown-800">
                          {index + 1}. {food.label}
                        </span>
                        <span className="shrink-0 font-bold text-chocolate-plum-700">
                          {food.count}×
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-dusty-taupe-100">
                        <div
                          className="h-full rounded-full bg-[#9b7450]"
                          style={{ width: `${(food.count / maximum) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </article>

          <div className="grid gap-5">
            <article className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
              <h3 className="font-bold text-chocolate-plum-950">Zutaten & Bestandteile</h3>
              {analysis.foodTermFrequency.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.foodTermFrequency.map((term) => (
                    <span
                      key={term.label}
                      className="rounded-full border border-[#ddcdbb] bg-[#faf5ed] px-3 py-1.5 text-sm font-semibold text-[#705638]"
                    >
                      {term.label} · {term.count}×
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-khaki-beige-50 px-4 py-6 text-center text-sm text-dusty-taupe-600">
                  Noch keine Zutatenbegriffe erkannt.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
              <h3 className="font-bold text-chocolate-plum-950">Mahlzeiten</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.mealTypeFrequency.length ? (
                  analysis.mealTypeFrequency.map((mealType) => (
                    <span
                      key={mealType.label}
                      className="rounded-xl bg-khaki-beige-50 px-3 py-2 text-sm font-medium text-ash-brown-800"
                    >
                      {mealType.label}{' '}
                      <strong className="ml-1 text-chocolate-plum-800">{mealType.count}×</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-dusty-taupe-600">
                    Noch keine Mahlzeiten erfasst.
                  </span>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-dusty-taupe-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-chocolate-plum-950">Protokoll</h2>
          </div>
          <label className="print:hidden">
            <span className="mb-1 block text-xs font-semibold text-dusty-taupe-600">Kategorie</span>
            <select
              value={entryFilter}
              onChange={(event) => setEntryFilter(event.target.value as 'ALL' | TrackingEntryType)}
              className="min-h-11 w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 text-sm font-semibold text-ash-brown-800 outline-none focus:border-chocolate-plum-500 sm:w-56"
            >
              <option value="ALL">Alle Kategorien</option>
              {TRACKING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-dusty-taupe-200">
          <div className="hidden grid-cols-[10rem_10rem_minmax(0,1fr)_3rem] gap-3 bg-khaki-beige-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-dusty-taupe-500 md:grid">
            <span>Zeitpunkt</span>
            <span>Kategorie</span>
            <span>Details / Notiz</span>
            <span />
          </div>
          {!isLoading && filteredEntries.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-dusty-taupe-600">
              Keine passenden Einträge vorhanden.
            </p>
          ) : null}
          <div className="divide-y divide-dusty-taupe-100">
            {filteredEntries.slice(0, 30).map((entry) => {
              const summary = getTrackingEntrySummary(entry)
              return (
                <article
                  key={entry.id}
                  className="relative grid gap-2 px-4 py-4 pr-16 md:grid-cols-[10rem_10rem_minmax(0,1fr)_3rem] md:items-center md:gap-3 md:pr-4"
                >
                  <time className="text-xs font-medium text-dusty-taupe-500 md:text-sm">
                    {new Intl.DateTimeFormat('de-CH', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(entry.occurred_at))}
                  </time>
                  <div className="flex items-center gap-2 text-sm font-semibold text-ash-brown-900">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${categoryColors[entry.entry_type]}`}
                    />
                    {getTrackingTypeLabel(entry.entry_type)}
                  </div>
                  <div className="min-w-0 text-sm text-dusty-taupe-700">
                    {summary ? <p>{summary}</p> : null}
                    {entry.note && entry.note !== summary ? (
                      <p className="mt-1 text-dusty-taupe-500">Notiz: {entry.note}</p>
                    ) : null}
                    {!summary && !entry.note ? (
                      <span className="text-dusty-taupe-400">–</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditEntry(entry)}
                    className="absolute right-3 grid size-11 place-items-center rounded-xl text-dusty-taupe-500 transition hover:bg-chocolate-plum-100 hover:text-chocolate-plum-700 md:static print:hidden"
                    aria-label={`${getTrackingTypeLabel(entry.entry_type)} bearbeiten`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                </article>
              )
            })}
          </div>
        </div>
        {filteredEntries.length > 30 ? (
          <p className="mt-3 text-center text-xs font-medium text-dusty-taupe-500">
            30 von {filteredEntries.length} Einträgen angezeigt · vollständig im CSV-Export
          </p>
        ) : null}
      </section>
    </main>
  )
}
