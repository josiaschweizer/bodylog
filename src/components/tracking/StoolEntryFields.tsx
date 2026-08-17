import { STOOL_CONSISTENCIES } from '@/lib/tracking'
import type { StoolAmount, StoolConsistency } from '@/lib/tracking'
import type { StoolDraft } from '@/lib/tracking-form'

type StoolEntryFieldsProps = {
  value: StoolDraft
  onChange: (value: StoolDraft) => void
}

export default function StoolEntryFields({ value, onChange }: StoolEntryFieldsProps) {
  function update(changes: Partial<StoolDraft>) {
    onChange({ ...value, ...changes })
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Details zum Stuhlgang</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Konsistenz</span>
          <select
            value={value.consistency}
            onChange={(event) => update({ consistency: event.target.value as StoolConsistency })}
            className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
          >
            {STOOL_CONSISTENCIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Bristol-Skala</span>
          <select
            value={value.bristolScale}
            onChange={(event) => update({ bristolScale: event.target.value })}
            className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
          >
            {Array.from({ length: 7 }, (_, index) => index + 1).map((number) => <option key={number} value={number}>Typ {number}</option>)}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Menge</span>
          <select
            value={value.amount}
            onChange={(event) => update({ amount: event.target.value as StoolAmount | '' })}
            className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
          >
            <option value="">Keine Angabe</option>
            <option value="SMALL">Klein</option>
            <option value="MEDIUM">Mittel</option>
            <option value="LARGE">Gross</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Farbe (optional)</span>
          <input
            value={value.color}
            onChange={(event) => update({ color: event.target.value })}
            placeholder="z. B. braun"
            className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none placeholder:text-dusty-taupe-400 focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="rounded-xl bg-khaki-beige-50 p-3">
          <span className="flex items-center justify-between text-sm font-semibold text-ash-brown-800">
            Dringlichkeit <strong>{value.urgency}/5</strong>
          </span>
          <input type="range" min="0" max="5" value={value.urgency} onChange={(event) => update({ urgency: event.target.value })} className="mt-3 w-full accent-chocolate-plum-700" />
        </label>
        <label className="rounded-xl bg-khaki-beige-50 p-3">
          <span className="flex items-center justify-between text-sm font-semibold text-ash-brown-800">
            Schmerzen <strong>{value.painLevel}/10</strong>
          </span>
          <input type="range" min="0" max="10" value={value.painLevel} onChange={(event) => update({ painLevel: event.target.value })} className="mt-3 w-full accent-chocolate-plum-700" />
        </label>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {[
          { key: 'blood', label: 'Blut sichtbar' },
          { key: 'mucus', label: 'Schleim sichtbar' },
          { key: 'unusualSmell', label: 'Ungewöhnlicher Geruch' },
        ].map((item) => (
          <label key={item.key} className="flex items-center gap-3 rounded-xl border border-dusty-taupe-200 px-3 py-3 text-sm font-medium text-ash-brown-800">
            <input
              type="checkbox"
              checked={value[item.key as 'blood' | 'mucus' | 'unusualSmell']}
              onChange={(event) => update({ [item.key]: event.target.checked })}
              className="size-4 accent-chocolate-plum-700"
            />
            {item.label}
          </label>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-ash-brown-800">Vollständige Entleerung?</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { value: true, label: 'Ja' },
            { value: false, label: 'Nein' },
            { value: null, label: 'Unklar' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => update({ completeEvacuation: option.value })}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                value.completeEvacuation === option.value
                  ? 'border-chocolate-plum-700 bg-chocolate-plum-100 text-chocolate-plum-900'
                  : 'border-dusty-taupe-200 bg-white text-dusty-taupe-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
