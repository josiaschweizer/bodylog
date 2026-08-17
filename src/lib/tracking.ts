import type { Database } from '@/types/Database'

export type TrackingEntryType = Database['public']['Enums']['tracking_entry_type']
export type MealType = Database['public']['Enums']['meal_type']
export type StoolAmount = Database['public']['Enums']['stool_amount']
export type StoolConsistency = Database['public']['Enums']['stool_consistency']
export type MedicationForm = Database['public']['Enums']['medication_form']
export type UrineAmount = Database['public']['Enums']['urine_amount']

export type Medication = Pick<
  Database['public']['Tables']['medications']['Row'],
  | 'id'
  | 'name'
  | 'active_ingredient'
  | 'strength'
  | 'strength_unit'
  | 'form'
  | 'default_dose'
  | 'default_dose_unit'
  | 'notes'
  | 'is_active'
>

export type SymptomSuggestion = Pick<
  Database['public']['Tables']['symptoms']['Row'],
  'id' | 'name'
>

export type FoodEntryDetails = Pick<
  Database['public']['Tables']['food_entries']['Row'],
  'meal_type' | 'description'
> & {
  food_entry_items: Array<
    Pick<
      Database['public']['Tables']['food_entry_items']['Row'],
      'id' | 'custom_name' | 'amount' | 'unit'
    >
  >
}

export type StoolEntryDetails = Pick<
  Database['public']['Tables']['stool_entries']['Row'],
  | 'consistency'
  | 'bristol_scale'
  | 'amount'
  | 'urgency'
  | 'pain_level'
  | 'blood'
  | 'mucus'
  | 'color'
  | 'unusual_smell'
  | 'complete_evacuation'
>

export type DrinkEntryDetails = Pick<
  Database['public']['Tables']['drink_entries']['Row'],
  'drink_name' | 'amount_ml' | 'caffeine_mg' | 'alcohol_percent'
>

export type SleepEntryDetails = Pick<
  Database['public']['Tables']['sleep_entries']['Row'],
  'sleep_started_at' | 'sleep_ended_at' | 'quality' | 'interruptions'
>

export type SymptomEntryDetails = Pick<
  Database['public']['Tables']['symptom_entries']['Row'],
  'symptom_id' | 'custom_name' | 'severity' | 'duration_minutes' | 'body_area'
> & {
  symptoms: SymptomSuggestion | null
}

export type MedicationEntryDetails = Pick<
  Database['public']['Tables']['medication_entries']['Row'],
  'medication_id' | 'medication_schedule_id' | 'dose' | 'dose_unit' | 'taken_as_needed'
> & {
  medications: Pick<Medication, 'id' | 'name'> | null
}

export type BodyMeasurementDetails = Omit<
  Database['public']['Tables']['body_measurements']['Row'],
  'id'
>

export type UrinationEntryDetails = Omit<
  Database['public']['Tables']['urination_entries']['Row'],
  'id'
>

export type TrackingEntry = Pick<
  Database['public']['Tables']['tracking_entries']['Row'],
  'id' | 'entry_type' | 'occurred_at' | 'note'
> & {
  food_entries: FoodEntryDetails | null
  stool_entries: StoolEntryDetails | null
  drink_entries: DrinkEntryDetails | null
  sleep_entries: SleepEntryDetails | null
  symptom_entries: SymptomEntryDetails | null
  medication_entries: MedicationEntryDetails | null
  body_measurements: BodyMeasurementDetails | null
  urination_entries: UrinationEntryDetails | null
}

export const TRACKING_TYPES: Array<{
  value: TrackingEntryType
  label: string
  shortLabel: string
}> = [
  { value: 'FOOD', label: 'Essen', shortLabel: 'Essen' },
  { value: 'DRINK', label: 'Getränk', shortLabel: 'Trinken' },
  { value: 'MEDICATION', label: 'Medikament', shortLabel: 'Medikament' },
  { value: 'SYMPTOM', label: 'Symptom', shortLabel: 'Symptom' },
  { value: 'STOOL', label: 'Stuhlgang', shortLabel: 'Stuhlgang' },
  { value: 'URINATION', label: 'Wasserlassen', shortLabel: 'Wasserlassen' },
  { value: 'BODY_MEASUREMENT', label: 'Körperwert', shortLabel: 'Körperwert' },
  { value: 'SLEEP', label: 'Schlaf', shortLabel: 'Schlaf' },
  { value: 'OTHER', label: 'Sonstiges', shortLabel: 'Sonstiges' },
]

export function getTrackingTypeLabel(type: TrackingEntryType) {
  return TRACKING_TYPES.find((item) => item.value === type)?.shortLabel ?? type
}

export const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: 'BREAKFAST', label: 'Frühstück' },
  { value: 'LUNCH', label: 'Mittagessen' },
  { value: 'DINNER', label: 'Abendessen' },
  { value: 'SNACK', label: 'Snack' },
  { value: 'OTHER', label: 'Andere Mahlzeit' },
]

export const STOOL_CONSISTENCIES: Array<{ value: StoolConsistency; label: string }> = [
  { value: 'WATERY_DIARRHEA', label: 'Wässriger Durchfall' },
  { value: 'DIARRHEA', label: 'Durchfall' },
  { value: 'SOFT', label: 'Weich' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HARD', label: 'Hart' },
  { value: 'VERY_HARD', label: 'Sehr hart' },
]

export function getTrackingEntrySummary(entry: TrackingEntry) {
  if (entry.food_entries?.food_entry_items.length) {
    return entry.food_entries.food_entry_items
      .map((item) => {
        const amount = item.amount ? `${item.amount} ` : ''
        const unit = item.unit ? `${item.unit} ` : ''
        return `${amount}${unit}${item.custom_name ?? ''}`.trim()
      })
      .join(' · ')
  }

  if (entry.stool_entries) {
    const consistency = STOOL_CONSISTENCIES.find(
      (item) => item.value === entry.stool_entries?.consistency,
    )?.label
    const bristol = entry.stool_entries.bristol_scale
      ? `Bristol ${entry.stool_entries.bristol_scale}`
      : null
    return [consistency, bristol].filter(Boolean).join(' · ')
  }

  if (entry.drink_entries) {
    const amount = entry.drink_entries.amount_ml ? `${entry.drink_entries.amount_ml} ml` : null
    return [entry.drink_entries.drink_name, amount].filter(Boolean).join(' · ')
  }

  if (entry.sleep_entries?.sleep_ended_at) {
    const duration =
      new Date(entry.sleep_entries.sleep_ended_at).getTime() -
      new Date(entry.sleep_entries.sleep_started_at).getTime()
    const hours = Math.floor(duration / 3_600_000)
    const minutes = Math.round((duration % 3_600_000) / 60_000)
    return `${hours} Std. ${minutes} Min.${entry.sleep_entries.quality ? ` · Qualität ${entry.sleep_entries.quality}/5` : ''}`
  }

  if (entry.symptom_entries) {
    const name = entry.symptom_entries.symptoms?.name ?? entry.symptom_entries.custom_name
    return `${name ?? 'Symptom'} · Stärke ${entry.symptom_entries.severity}/10`
  }

  if (entry.medication_entries) {
    const dose = entry.medication_entries.dose
      ? `${entry.medication_entries.dose} ${entry.medication_entries.dose_unit ?? ''}`.trim()
      : null
    return [entry.medication_entries.medications?.name ?? 'Medikament', dose]
      .filter(Boolean)
      .join(' · ')
  }

  if (entry.body_measurements) {
    return [
      entry.body_measurements.weight_kg ? `${entry.body_measurements.weight_kg} kg` : null,
      entry.body_measurements.temperature_celsius
        ? `${entry.body_measurements.temperature_celsius} °C`
        : null,
      entry.body_measurements.pulse_bpm ? `Puls ${entry.body_measurements.pulse_bpm}` : null,
      entry.body_measurements.systolic_blood_pressure &&
      entry.body_measurements.diastolic_blood_pressure
        ? `Blutdruck ${entry.body_measurements.systolic_blood_pressure}/${entry.body_measurements.diastolic_blood_pressure}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  if (entry.urination_entries) {
    const amountLabels = { SMALL: 'klein', MEDIUM: 'mittel', LARGE: 'gross' }
    return [
      entry.urination_entries.amount
        ? `Menge ${amountLabels[entry.urination_entries.amount]}`
        : null,
      entry.urination_entries.color,
      entry.urination_entries.burning ? 'Brennen' : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  return entry.note
}
