import getBrowserClient from '@/lib/supabase/getBrowserClient'
import type { MedicationForm } from '@/lib/tracking'

export type MedicationWithSchedules = {
  id: string
  name: string
  active_ingredient: string | null
  strength: number | null
  strength_unit: string | null
  form: MedicationForm
  default_dose: number | null
  default_dose_unit: string | null
  notes: string | null
  is_active: boolean
  medication_schedules: Array<{
    id: string
    scheduled_time: string | null
    dose: number | null
    dose_unit: string | null
    weekdays: number[] | null
    is_active: boolean
  }>
}

export type MedicationInput = {
  name: string
  activeIngredient: string
  strength: number | null
  strengthUnit: string
  form: MedicationForm
  defaultDose: number | null
  defaultDoseUnit: string
  scheduledTime: string
  scheduleId?: string | null
  notes: string
}

export async function getMedications() {
  const { data, error } = await getBrowserClient()
    .from('medications')
    .select(
      `
      id,
      name,
      active_ingredient,
      strength,
      strength_unit,
      form,
      default_dose,
      default_dose_unit,
      notes,
      is_active,
      medication_schedules (id, scheduled_time, dose, dose_unit, weekdays, is_active)
    `,
    )
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data satisfies MedicationWithSchedules[]
}

export async function createMedication(input: MedicationInput) {
  const supabase = getBrowserClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Not authenticated')

  const { data: medication, error } = await supabase
    .from('medications')
    .insert({
      user_id: userData.user.id,
      name: input.name.trim(),
      active_ingredient: input.activeIngredient.trim() || null,
      strength: input.strength,
      strength_unit: input.strengthUnit.trim() || null,
      form: input.form,
      default_dose: input.defaultDose,
      default_dose_unit: input.defaultDoseUnit.trim() || null,
      notes: input.notes.trim() || null,
    })
    .select('id')
    .single()

  if (error) throw error

  if (input.scheduledTime) {
    const { error: scheduleError } = await supabase.from('medication_schedules').insert({
      user_id: userData.user.id,
      medication_id: medication.id,
      schedule_type: 'SCHEDULED',
      scheduled_time: input.scheduledTime,
      dose: input.defaultDose,
      dose_unit: input.defaultDoseUnit.trim() || null,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
    })

    if (scheduleError) {
      await supabase.from('medications').delete().eq('id', medication.id)
      throw scheduleError
    }
  }

  return medication
}

export async function updateMedication(id: string, input: MedicationInput) {
  const supabase = getBrowserClient()
  const { error } = await supabase
    .from('medications')
    .update({
      name: input.name.trim(),
      active_ingredient: input.activeIngredient.trim() || null,
      strength: input.strength,
      strength_unit: input.strengthUnit.trim() || null,
      form: input.form,
      default_dose: input.defaultDose,
      default_dose_unit: input.defaultDoseUnit.trim() || null,
      notes: input.notes.trim() || null,
    })
    .eq('id', id)

  if (error) throw error

  if (input.scheduleId) {
    const { error: scheduleError } = await supabase
      .from('medication_schedules')
      .update({
        scheduled_time: input.scheduledTime || null,
        dose: input.defaultDose,
        dose_unit: input.defaultDoseUnit.trim() || null,
        is_active: Boolean(input.scheduledTime),
      })
      .eq('id', input.scheduleId)

    if (scheduleError) throw scheduleError
    return
  }

  if (input.scheduledTime) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) throw userError ?? new Error('Not authenticated')

    const { error: scheduleError } = await supabase.from('medication_schedules').insert({
      user_id: userData.user.id,
      medication_id: id,
      schedule_type: 'SCHEDULED',
      scheduled_time: input.scheduledTime,
      dose: input.defaultDose,
      dose_unit: input.defaultDoseUnit.trim() || null,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
    })

    if (scheduleError) throw scheduleError
  }
}

export async function deactivateMedication(id: string) {
  const { error } = await getBrowserClient()
    .from('medications')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}
