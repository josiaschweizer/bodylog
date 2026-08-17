import type { UrineAmount } from '@/lib/tracking'
import type { UrinationDraft } from '@/lib/tracking-form'

type UrinationEntryFieldsProps = {
  value: UrinationDraft
  onChange: (value: UrinationDraft) => void
}

export default function UrinationEntryFields({ value, onChange }: UrinationEntryFieldsProps) {
  function update(changes: Partial<UrinationDraft>) {
    onChange({ ...value, ...changes })
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Details zum Wasserlassen</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="mb-2 block text-sm font-semibold">Menge</span><select value={value.amount} onChange={(event) => update({ amount: event.target.value as UrineAmount | '' })} className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 outline-none"><option value="">Keine Angabe</option><option value="SMALL">Klein</option><option value="MEDIUM">Mittel</option><option value="LARGE">Gross</option></select></label>
        <label><span className="mb-2 block text-sm font-semibold">Farbe</span><input list="urine-colors" value={value.color} onChange={(event) => update({ color: event.target.value })} placeholder="Auswählen oder eingeben" className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 outline-none" /><datalist id="urine-colors"><option value="Klar" /><option value="Hellgelb" /><option value="Gelb" /><option value="Dunkelgelb" /><option value="Orange" /><option value="Rötlich" /></datalist></label>
        <label className="rounded-xl bg-khaki-beige-50 p-3"><span className="flex justify-between text-sm font-semibold">Dringlichkeit <strong>{value.urgency}/5</strong></span><input type="range" min="0" max="5" value={value.urgency} onChange={(event) => update({ urgency: event.target.value })} className="mt-3 w-full accent-chocolate-plum-700" /></label>
        <label className="rounded-xl bg-khaki-beige-50 p-3"><span className="flex justify-between text-sm font-semibold">Schmerzen <strong>{value.painLevel}/10</strong></span><input type="range" min="0" max="10" value={value.painLevel} onChange={(event) => update({ painLevel: event.target.value })} className="mt-3 w-full accent-chocolate-plum-700" /></label>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-dusty-taupe-200 px-3 py-3 text-sm font-medium"><input type="checkbox" checked={value.burning} onChange={(event) => update({ burning: event.target.checked })} className="size-4 accent-chocolate-plum-700" />Brennen</label>
        <label className="flex items-center gap-3 rounded-xl border border-dusty-taupe-200 px-3 py-3 text-sm font-medium"><input type="checkbox" checked={value.nighttime} onChange={(event) => update({ nighttime: event.target.checked })} className="size-4 accent-chocolate-plum-700" />Nachts</label>
      </div>
    </fieldset>
  )
}
