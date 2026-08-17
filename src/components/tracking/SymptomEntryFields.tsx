import type { SymptomSuggestion } from '@/lib/tracking'
import type { SymptomDraft } from '@/lib/tracking-form'

type SymptomEntryFieldsProps = {
  value: SymptomDraft
  suggestions: SymptomSuggestion[]
  onChange: (value: SymptomDraft) => void
}

export default function SymptomEntryFields({ value, suggestions, onChange }: SymptomEntryFieldsProps) {
  function update(changes: Partial<SymptomDraft>) {
    onChange({ ...value, ...changes })
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Details zum Symptom</legend>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Symptom</span>
        <input
          required
          list="symptom-suggestions"
          value={value.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Auswählen oder selbst eingeben"
          className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-4 py-3 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
        />
        <datalist id="symptom-suggestions">
          {suggestions.map((suggestion) => <option key={suggestion.id} value={suggestion.name} />)}
        </datalist>
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl bg-khaki-beige-50 p-3">
          <span className="flex items-center justify-between text-sm font-semibold text-ash-brown-800">
            Stärke <strong>{value.severity}/10</strong>
          </span>
          <input type="range" min="0" max="10" value={value.severity} onChange={(event) => update({ severity: event.target.value })} className="mt-3 w-full accent-chocolate-plum-700" />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Dauer (Minuten)</span>
          <input type="number" min="0" value={value.durationMinutes} onChange={(event) => update({ durationMinutes: event.target.value })} placeholder="optional" className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Körperbereich</span>
          <input value={value.bodyArea} onChange={(event) => update({ bodyArea: event.target.value })} placeholder="z. B. linker Unterbauch" className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100" />
        </label>
      </div>
    </fieldset>
  )
}
