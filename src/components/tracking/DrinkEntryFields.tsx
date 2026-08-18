import type { DrinkDraft } from '@/lib/tracking-form'

type DrinkEntryFieldsProps = {
  value: DrinkDraft
  suggestions: string[]
  onChange: (value: DrinkDraft) => void
}

export default function DrinkEntryFields({ value, suggestions, onChange }: DrinkEntryFieldsProps) {
  function update(changes: Partial<DrinkDraft>) {
    onChange({ ...value, ...changes })
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">
        Details zum Getränk
      </legend>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Getränk</span>
        <input
          required
          list="drink-suggestions"
          value={value.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Auswählen oder selbst eingeben"
          className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-4 py-3 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
        />
        <datalist id="drink-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { key: 'amountMl', label: 'Menge (ml)', placeholder: '300' },
          { key: 'caffeineMg', label: 'Koffein (mg)', placeholder: 'optional' },
          { key: 'alcoholPercent', label: 'Alkohol (%)', placeholder: 'optional' },
        ].map((field) => (
          <label key={field.key}>
            <span className="mb-2 block text-sm font-semibold text-ash-brown-800">
              {field.label}
            </span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={value[field.key as keyof DrinkDraft]}
              onChange={(event) => update({ [field.key]: event.target.value })}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
