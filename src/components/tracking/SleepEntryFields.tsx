import type { SleepDraft } from '@/lib/tracking-form'

type SleepEntryFieldsProps = {
  value: SleepDraft
  onChange: (value: SleepDraft) => void
}

export default function SleepEntryFields({ value, onChange }: SleepEntryFieldsProps) {
  function update(changes: Partial<SleepDraft>) {
    onChange({ ...value, ...changes })
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Details zum Schlaf</legend>
      <p className="mb-4 text-sm text-dusty-taupe-600">Der gewählte Zeitpunkt gilt als Ende des Schlafs.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: 'hours', label: 'Stunden', min: 0, max: 24 },
          { key: 'minutes', label: 'Minuten', min: 0, max: 59 },
          { key: 'quality', label: 'Qualität (1–5)', min: 1, max: 5 },
          { key: 'interruptions', label: 'Unterbrechungen', min: 0, max: 50 },
        ].map((field) => (
          <label key={field.key}>
            <span className="mb-2 block text-xs font-semibold text-ash-brown-800 sm:text-sm">{field.label}</span>
            <input
              type="number"
              min={field.min}
              max={field.max}
              required={field.key === 'hours'}
              value={value[field.key as keyof SleepDraft]}
              onChange={(event) => update({ [field.key]: event.target.value })}
              className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
