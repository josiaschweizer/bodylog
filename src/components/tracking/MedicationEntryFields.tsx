import type { Medication } from '@/lib/tracking'
import type { MedicationDraft } from '@/lib/tracking-form'

type MedicationEntryFieldsProps = {
  value: MedicationDraft
  medications: Medication[]
  onChange: (value: MedicationDraft) => void
}

export default function MedicationEntryFields({ value, medications, onChange }: MedicationEntryFieldsProps) {
  function selectMedication(medicationId: string) {
    const medication = medications.find((item) => item.id === medicationId)
    onChange({
      ...value,
      medicationId,
      dose: medication?.default_dose?.toString() ?? '',
      doseUnit: medication?.default_dose_unit ?? '',
    })
  }

  return (
    <fieldset className="rounded-2xl border border-dusty-taupe-200 bg-white p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold text-chocolate-plum-800">Medikamenteneinnahme</legend>
      {medications.length ? (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Medikament</span>
            <select required value={value.medicationId} onChange={(event) => selectMedication(event.target.value)} className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-4 py-3 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100">
              <option value="">Bitte auswählen</option>
              {medications.map((medication) => <option key={medication.id} value={medication.id}>{medication.name}</option>)}
            </select>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label>
              <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Dosis</span>
              <input type="number" min="0" step="0.001" value={value.dose} onChange={(event) => onChange({ ...value, dose: event.target.value })} className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Einheit</span>
              <input value={value.doseUnit} onChange={(event) => onChange({ ...value, doseUnit: event.target.value })} placeholder="z. B. mg" className="w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100" />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-xl bg-khaki-beige-50 px-4 py-3 text-sm font-medium text-ash-brown-800">
            <input type="checkbox" checked={value.takenAsNeeded} onChange={(event) => onChange({ ...value, takenAsNeeded: event.target.checked })} className="size-4 accent-chocolate-plum-700" />
            Bei Bedarf eingenommen
          </label>
        </>
      ) : (
        <p className="rounded-xl bg-khaki-beige-100 px-4 py-3 text-sm text-khaki-beige-800">
          Hinterlege zuerst auf der Profilseite ein Medikament.
        </p>
      )}
    </fieldset>
  )
}
