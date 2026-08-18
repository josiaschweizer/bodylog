import type { BodyMeasurementDraft } from '@/lib/tracking-form'

type BodyMeasurementFieldsProps = {
  value: BodyMeasurementDraft
  onChange: (value: BodyMeasurementDraft) => void
}

export default function BodyMeasurementFields({ value, onChange }: BodyMeasurementFieldsProps) {
  function update(changes: Partial<BodyMeasurementDraft>) {
    onChange({ ...value, ...changes })
  }

  const fields = [
    { key: 'weightKg', label: 'Gewicht (kg)', step: '0.1' },
    { key: 'temperatureCelsius', label: 'Temperatur (°C)', step: '0.1' },
    { key: 'pulseBpm', label: 'Puls (bpm)', step: '1' },
    { key: 'systolicBloodPressure', label: 'Blutdruck systolisch', step: '1' },
    { key: 'diastolicBloodPressure', label: 'Blutdruck diastolisch', step: '1' },
  ] as const

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Körperwerte</legend>
      <p className="mb-4 text-sm text-dusty-taupe-600">Fülle mindestens einen Wert aus.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-ash-brown-800">
              {field.label}
            </span>
            <input
              type="number"
              min="0"
              step={field.step}
              value={value[field.key]}
              onChange={(event) => update({ [field.key]: event.target.value })}
              className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
