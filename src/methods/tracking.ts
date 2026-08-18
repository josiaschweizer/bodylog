import getBrowserClient from '@/lib/supabase/getBrowserClient'
import type {
  MealType,
  StoolAmount,
  StoolConsistency,
  Medication,
  SymptomSuggestion,
  UrineAmount,
  TrackingEntry,
  TrackingEntryType,
} from '@/lib/tracking'

export type TrackingEntryDetails =
  | {
      kind: 'FOOD'
      mealType: MealType
      items: Array<{ name: string; amount: number | null; unit: string }>
    }
  | {
      kind: 'STOOL'
      consistency: StoolConsistency
      bristolScale: number | null
      amount: StoolAmount | null
      urgency: number | null
      painLevel: number | null
      blood: boolean
      mucus: boolean
      color: string
      unusualSmell: boolean
      completeEvacuation: boolean | null
    }
  | {
      kind: 'DRINK'
      name: string
      amountMl: number | null
      caffeineMg: number | null
      alcoholPercent: number | null
    }
  | {
      kind: 'SLEEP'
      durationMinutes: number
      quality: number | null
      interruptions: number | null
    }
  | {
      kind: 'SYMPTOM'
      symptomId: string | null
      customName: string
      severity: number
      durationMinutes: number | null
      bodyArea: string
    }
  | {
      kind: 'MEDICATION'
      medicationId: string
      dose: number | null
      doseUnit: string
      takenAsNeeded: boolean
    }
  | {
      kind: 'BODY_MEASUREMENT'
      weightKg: number | null
      temperatureCelsius: number | null
      pulseBpm: number | null
      systolicBloodPressure: number | null
      diastolicBloodPressure: number | null
    }
  | {
      kind: 'URINATION'
      amount: UrineAmount | null
      color: string
      urgency: number | null
      painLevel: number | null
      burning: boolean
      nighttime: boolean
    }

export async function getTrackingEntries(from: Date, to: Date) {
  const { data, error } = await getBrowserClient()
    .from('tracking_entries')
    .select(
      `
      id,
      entry_type,
      occurred_at,
      note,
      food_entries (
        meal_type,
        description,
        food_entry_items (id, custom_name, amount, unit)
      ),
      stool_entries (
        consistency,
        bristol_scale,
        amount,
        urgency,
        pain_level,
        blood,
        mucus,
        color,
        unusual_smell,
        complete_evacuation
      ),
      drink_entries (drink_name, amount_ml, caffeine_mg, alcohol_percent),
      sleep_entries (sleep_started_at, sleep_ended_at, quality, interruptions),
      symptom_entries (
        symptom_id,
        custom_name,
        severity,
        duration_minutes,
        body_area,
        symptoms (id, name)
      ),
      medication_entries (
        medication_id,
        medication_schedule_id,
        dose,
        dose_unit,
        taken_as_needed,
        medications (id, name)
      ),
      body_measurements (
        weight_kg,
        temperature_celsius,
        pulse_bpm,
        systolic_blood_pressure,
        diastolic_blood_pressure
      ),
      urination_entries (amount, color, urgency, pain_level, burning, nighttime)
    `,
    )
    .gte('occurred_at', from.toISOString())
    .lt('occurred_at', to.toISOString())
    .order('occurred_at', { ascending: false })

  if (error) throw error
  return data satisfies TrackingEntry[]
}

export async function createTrackingEntry(input: {
  entryType: TrackingEntryType
  occurredAt: Date
  note: string
  details?: TrackingEntryDetails
}) {
  const supabase = getBrowserClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) throw userError ?? new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tracking_entries')
    .insert({
      user_id: userData.user.id,
      entry_type: input.entryType,
      occurred_at: input.occurredAt.toISOString(),
      note: input.note.trim() || null,
    })
    .select('id, entry_type, occurred_at, note')
    .single()

  if (error) throw error

  try {
    if (input.details?.kind === 'FOOD') {
      const { error: foodError } = await supabase.from('food_entries').insert({
        id: data.id,
        meal_type: input.details.mealType,
      })
      if (foodError) throw foodError

      const { error: itemsError } = await supabase.from('food_entry_items').insert(
        input.details.items.map((item) => ({
          food_entry_id: data.id,
          custom_name: item.name.trim(),
          amount: item.amount,
          unit: item.unit.trim() || null,
        })),
      )
      if (itemsError) throw itemsError
    }

    if (input.details?.kind === 'STOOL') {
      const { error: stoolError } = await supabase.from('stool_entries').insert({
        id: data.id,
        consistency: input.details.consistency,
        bristol_scale: input.details.bristolScale,
        amount: input.details.amount,
        urgency: input.details.urgency,
        pain_level: input.details.painLevel,
        blood: input.details.blood,
        mucus: input.details.mucus,
        color: input.details.color.trim() || null,
        unusual_smell: input.details.unusualSmell,
        complete_evacuation: input.details.completeEvacuation,
      })
      if (stoolError) throw stoolError
    }

    if (input.details?.kind === 'DRINK') {
      const { error: drinkError } = await supabase.from('drink_entries').insert({
        id: data.id,
        drink_name: input.details.name.trim(),
        amount_ml: input.details.amountMl,
        caffeine_mg: input.details.caffeineMg,
        alcohol_percent: input.details.alcoholPercent,
      })
      if (drinkError) throw drinkError
    }

    if (input.details?.kind === 'SLEEP') {
      const sleepEndedAt = input.occurredAt
      const sleepStartedAt = new Date(
        sleepEndedAt.getTime() - input.details.durationMinutes * 60_000,
      )
      const { error: sleepError } = await supabase.from('sleep_entries').insert({
        id: data.id,
        sleep_started_at: sleepStartedAt.toISOString(),
        sleep_ended_at: sleepEndedAt.toISOString(),
        quality: input.details.quality,
        interruptions: input.details.interruptions,
      })
      if (sleepError) throw sleepError
    }

    if (input.details?.kind === 'SYMPTOM') {
      const { error: symptomError } = await supabase.from('symptom_entries').insert({
        id: data.id,
        symptom_id: input.details.symptomId,
        custom_name: input.details.symptomId ? null : input.details.customName.trim(),
        severity: input.details.severity,
        duration_minutes: input.details.durationMinutes,
        body_area: input.details.bodyArea.trim() || null,
      })
      if (symptomError) throw symptomError
    }

    if (input.details?.kind === 'MEDICATION') {
      const { error: medicationError } = await supabase.from('medication_entries').insert({
        id: data.id,
        medication_id: input.details.medicationId,
        dose: input.details.dose,
        dose_unit: input.details.doseUnit.trim() || null,
        taken_as_needed: input.details.takenAsNeeded,
      })
      if (medicationError) throw medicationError
    }

    if (input.details?.kind === 'BODY_MEASUREMENT') {
      const { error: measurementError } = await supabase.from('body_measurements').insert({
        id: data.id,
        weight_kg: input.details.weightKg,
        temperature_celsius: input.details.temperatureCelsius,
        pulse_bpm: input.details.pulseBpm,
        systolic_blood_pressure: input.details.systolicBloodPressure,
        diastolic_blood_pressure: input.details.diastolicBloodPressure,
      })
      if (measurementError) throw measurementError
    }

    if (input.details?.kind === 'URINATION') {
      const { error: urinationError } = await supabase.from('urination_entries').insert({
        id: data.id,
        amount: input.details.amount,
        color: input.details.color.trim() || null,
        urgency: input.details.urgency,
        pain_level: input.details.painLevel,
        burning: input.details.burning,
        nighttime: input.details.nighttime,
      })
      if (urinationError) throw urinationError
    }
  } catch (detailsError) {
    await supabase.from('tracking_entries').delete().eq('id', data.id)
    throw detailsError
  }

  return data
}

export async function updateTrackingEntry(
  id: string,
  input: {
    entryType: TrackingEntryType
    occurredAt: Date
    note: string
    details?: TrackingEntryDetails
  },
) {
  const supabase = getBrowserClient()
  const { error } = await supabase
    .from('tracking_entries')
    .update({
      occurred_at: input.occurredAt.toISOString(),
      note: input.note.trim() || null,
    })
    .eq('id', id)
  if (error) throw error

  if (input.details?.kind === 'FOOD') {
    const { error: foodError } = await supabase.from('food_entries').upsert({
      id,
      meal_type: input.details.mealType,
    })
    if (foodError) throw foodError
    const { error: deleteItemsError } = await supabase
      .from('food_entry_items')
      .delete()
      .eq('food_entry_id', id)
    if (deleteItemsError) throw deleteItemsError
    const { error: itemsError } = await supabase.from('food_entry_items').insert(
      input.details.items.map((item) => ({
        food_entry_id: id,
        custom_name: item.name.trim(),
        amount: item.amount,
        unit: item.unit.trim() || null,
      })),
    )
    if (itemsError) throw itemsError
  }

  if (input.details?.kind === 'STOOL') {
    const { error: stoolError } = await supabase.from('stool_entries').upsert({
      id,
      consistency: input.details.consistency,
      bristol_scale: input.details.bristolScale,
      amount: input.details.amount,
      urgency: input.details.urgency,
      pain_level: input.details.painLevel,
      blood: input.details.blood,
      mucus: input.details.mucus,
      color: input.details.color.trim() || null,
      unusual_smell: input.details.unusualSmell,
      complete_evacuation: input.details.completeEvacuation,
    })
    if (stoolError) throw stoolError
  }

  if (input.details?.kind === 'DRINK') {
    const { error: drinkError } = await supabase.from('drink_entries').upsert({
      id,
      drink_name: input.details.name.trim(),
      amount_ml: input.details.amountMl,
      caffeine_mg: input.details.caffeineMg,
      alcohol_percent: input.details.alcoholPercent,
    })
    if (drinkError) throw drinkError
  }

  if (input.details?.kind === 'SLEEP') {
    const sleepStartedAt = new Date(
      input.occurredAt.getTime() - input.details.durationMinutes * 60_000,
    )
    const { error: sleepError } = await supabase.from('sleep_entries').upsert({
      id,
      sleep_started_at: sleepStartedAt.toISOString(),
      sleep_ended_at: input.occurredAt.toISOString(),
      quality: input.details.quality,
      interruptions: input.details.interruptions,
    })
    if (sleepError) throw sleepError
  }

  if (input.details?.kind === 'SYMPTOM') {
    const { error: symptomError } = await supabase.from('symptom_entries').upsert({
      id,
      symptom_id: input.details.symptomId,
      custom_name: input.details.symptomId ? null : input.details.customName.trim(),
      severity: input.details.severity,
      duration_minutes: input.details.durationMinutes,
      body_area: input.details.bodyArea.trim() || null,
    })
    if (symptomError) throw symptomError
  }

  if (input.details?.kind === 'MEDICATION') {
    const { error: medicationError } = await supabase.from('medication_entries').upsert({
      id,
      medication_id: input.details.medicationId,
      dose: input.details.dose,
      dose_unit: input.details.doseUnit.trim() || null,
      taken_as_needed: input.details.takenAsNeeded,
    })
    if (medicationError) throw medicationError
  }

  if (input.details?.kind === 'BODY_MEASUREMENT') {
    const { error: measurementError } = await supabase.from('body_measurements').upsert({
      id,
      weight_kg: input.details.weightKg,
      temperature_celsius: input.details.temperatureCelsius,
      pulse_bpm: input.details.pulseBpm,
      systolic_blood_pressure: input.details.systolicBloodPressure,
      diastolic_blood_pressure: input.details.diastolicBloodPressure,
    })
    if (measurementError) throw measurementError
  }

  if (input.details?.kind === 'URINATION') {
    const { error: urinationError } = await supabase.from('urination_entries').upsert({
      id,
      amount: input.details.amount,
      color: input.details.color.trim() || null,
      urgency: input.details.urgency,
      pain_level: input.details.painLevel,
      burning: input.details.burning,
      nighttime: input.details.nighttime,
    })
    if (urinationError) throw urinationError
  }
}

export async function getTrackingSuggestions() {
  const supabase = getBrowserClient()
  const [drinksResult, symptomsResult, customSymptomsResult, medicationsResult] = await Promise.all(
    [
      supabase.from('drink_entries').select('drink_name').limit(100),
      supabase.from('symptoms').select('id, name').eq('is_active', true).order('name'),
      supabase
        .from('symptom_entries')
        .select('custom_name')
        .not('custom_name', 'is', null)
        .limit(100),
      supabase
        .from('medications')
        .select(
          'id, name, active_ingredient, strength, strength_unit, form, default_dose, default_dose_unit, notes, is_active',
        )
        .eq('is_active', true)
        .order('name'),
    ],
  )

  if (drinksResult.error) throw drinksResult.error
  if (symptomsResult.error) throw symptomsResult.error
  if (customSymptomsResult.error) throw customSymptomsResult.error
  if (medicationsResult.error) throw medicationsResult.error

  const drinks = Array.from(
    new Set([
      'Wasser',
      'Kaffee',
      'Tee',
      'Mineralwasser',
      'Saft',
      ...drinksResult.data.map((item) => item.drink_name),
    ]),
  )

  const storedSymptomNames = new Set(
    symptomsResult.data.map((symptom) => symptom.name.toLocaleLowerCase('de-CH')),
  )
  const customSymptoms = [
    'Kopfschmerzen',
    'Bauchschmerzen',
    'Übelkeit',
    'Schwindel',
    'Müdigkeit',
    ...customSymptomsResult.data.flatMap((item) => (item.custom_name ? [item.custom_name] : [])),
  ]
    .filter((name, index, allNames) => {
      const normalizedName = name.toLocaleLowerCase('de-CH')
      return (
        !storedSymptomNames.has(normalizedName) &&
        allNames.findIndex(
          (candidate) => candidate.toLocaleLowerCase('de-CH') === normalizedName,
        ) === index
      )
    })
    .map((name) => ({ id: '', name }))

  return {
    drinks,
    symptoms: [...symptomsResult.data, ...customSymptoms] satisfies SymptomSuggestion[],
    medications: medicationsResult.data satisfies Medication[],
  }
}
