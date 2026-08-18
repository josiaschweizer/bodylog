import type { MealType, StoolAmount, StoolConsistency, UrineAmount } from '@/lib/tracking'

export type FoodItemDraft = {
  id: string
  name: string
  amount: string
  unit: string
}

function createFoodItem(): FoodItemDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: '1',
    unit: 'Teller',
  }
}

export function getInitialFoodItems() {
  return [createFoodItem()]
}

export function addEmptyFoodItem(items: FoodItemDraft[]) {
  return [...items, createFoodItem()]
}

export function getSuggestedMealType(): MealType {
  const hour = new Date().getHours()
  if (hour < 10) {
    return 'BREAKFAST'
  }
  if (hour < 15) {
    return 'LUNCH'
  }
  if (hour < 21) {
    return 'DINNER'
  }
  return 'SNACK'
}

export type StoolDraft = {
  consistency: StoolConsistency
  bristolScale: string
  amount: StoolAmount | ''
  urgency: string
  painLevel: string
  color: string
  blood: boolean
  mucus: boolean
  unusualSmell: boolean
  completeEvacuation: boolean | null
}

export const INITIAL_STOOL_DRAFT: StoolDraft = {
  consistency: 'NORMAL',
  bristolScale: '4',
  amount: 'MEDIUM',
  urgency: '2',
  painLevel: '0',
  color: '',
  blood: false,
  mucus: false,
  unusualSmell: false,
  completeEvacuation: null,
}

export type DrinkDraft = {
  name: string
  amountMl: string
  caffeineMg: string
  alcoholPercent: string
}

export const INITIAL_DRINK_DRAFT: DrinkDraft = {
  name: 'Wasser',
  amountMl: '500',
  caffeineMg: '',
  alcoholPercent: '',
}

export type SleepDraft = {
  hours: string
  minutes: string
  quality: string
  interruptions: string
}

export const INITIAL_SLEEP_DRAFT: SleepDraft = {
  hours: '8',
  minutes: '0',
  quality: '3',
  interruptions: '0',
}

export type SymptomDraft = {
  name: string
  severity: string
  durationMinutes: string
  bodyArea: string
}

export const INITIAL_SYMPTOM_DRAFT: SymptomDraft = {
  name: '',
  severity: '5',
  durationMinutes: '',
  bodyArea: '',
}

export type MedicationDraft = {
  medicationId: string
  dose: string
  doseUnit: string
  takenAsNeeded: boolean
}

export const INITIAL_MEDICATION_DRAFT: MedicationDraft = {
  medicationId: '',
  dose: '',
  doseUnit: '',
  takenAsNeeded: false,
}

export type BodyMeasurementDraft = {
  weightKg: string
  temperatureCelsius: string
  pulseBpm: string
  systolicBloodPressure: string
  diastolicBloodPressure: string
}

export const INITIAL_BODY_MEASUREMENT_DRAFT: BodyMeasurementDraft = {
  weightKg: '',
  temperatureCelsius: '',
  pulseBpm: '',
  systolicBloodPressure: '',
  diastolicBloodPressure: '',
}

export type UrinationDraft = {
  amount: UrineAmount | ''
  color: string
  urgency: string
  painLevel: string
  burning: boolean
  nighttime: boolean
}

export const INITIAL_URINATION_DRAFT: UrinationDraft = {
  amount: 'MEDIUM',
  color: '',
  urgency: '1',
  painLevel: '0',
  burning: false,
  nighttime: false,
}
