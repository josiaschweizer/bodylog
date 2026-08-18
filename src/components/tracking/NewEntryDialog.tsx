import { useEffect, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'
import { LoaderCircle, Plus, X } from 'lucide-react'
import FoodEntryFields from '@/components/tracking/FoodEntryFields'
import BodyMeasurementFields from '@/components/tracking/BodyMeasurementFields'
import DrinkEntryFields from '@/components/tracking/DrinkEntryFields'
import MedicationEntryFields from '@/components/tracking/MedicationEntryFields'
import SleepEntryFields from '@/components/tracking/SleepEntryFields'
import StoolEntryFields from '@/components/tracking/StoolEntryFields'
import SymptomEntryFields from '@/components/tracking/SymptomEntryFields'
import UrinationEntryFields from '@/components/tracking/UrinationEntryFields'
import { TRACKING_TYPES } from '@/lib/tracking'
import type {
  MealType,
  Medication,
  SymptomSuggestion,
  TrackingEntry,
  TrackingEntryType,
} from '@/lib/tracking'
import {
  getInitialFoodItems,
  getSuggestedMealType,
  INITIAL_BODY_MEASUREMENT_DRAFT,
  INITIAL_DRINK_DRAFT,
  INITIAL_MEDICATION_DRAFT,
  INITIAL_SLEEP_DRAFT,
  INITIAL_STOOL_DRAFT,
  INITIAL_SYMPTOM_DRAFT,
  INITIAL_URINATION_DRAFT,
} from '@/lib/tracking-form'
import type {
  BodyMeasurementDraft,
  DrinkDraft,
  FoodItemDraft,
  MedicationDraft,
  SleepDraft,
  StoolDraft,
  SymptomDraft,
  UrinationDraft,
} from '@/lib/tracking-form'
import {
  createTrackingEntry,
  getTrackingSuggestions,
  updateTrackingEntry,
} from '@/methods/tracking'
import type { TrackingEntryDetails } from '@/methods/tracking'

type NewEntryDialogProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  entryToEdit?: TrackingEntry | null
}

function getLocalDateTimeValue(date = new Date()) {
  const offsetInMilliseconds = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetInMilliseconds).toISOString().slice(0, 16)
}

export default function NewEntryDialog({
  isOpen,
  onClose,
  onCreated,
  entryToEdit,
}: NewEntryDialogProps) {
  const [entryType, setEntryType] = useState<TrackingEntryType>('SYMPTOM')
  const [occurredAt, setOccurredAt] = useState(getLocalDateTimeValue)
  const [note, setNote] = useState('')
  const [mealType, setMealType] = useState<MealType>(getSuggestedMealType)
  const [foodItems, setFoodItems] = useState<FoodItemDraft[]>(getInitialFoodItems)
  const [stool, setStool] = useState<StoolDraft>({ ...INITIAL_STOOL_DRAFT })
  const [drink, setDrink] = useState<DrinkDraft>({ ...INITIAL_DRINK_DRAFT })
  const [sleep, setSleep] = useState<SleepDraft>({ ...INITIAL_SLEEP_DRAFT })
  const [symptom, setSymptom] = useState<SymptomDraft>({ ...INITIAL_SYMPTOM_DRAFT })
  const [medication, setMedication] = useState<MedicationDraft>({ ...INITIAL_MEDICATION_DRAFT })
  const [bodyMeasurement, setBodyMeasurement] = useState<BodyMeasurementDraft>({
    ...INITIAL_BODY_MEASUREMENT_DRAFT,
  })
  const [urination, setUrination] = useState<UrinationDraft>({ ...INITIAL_URINATION_DRAFT })
  const [drinkSuggestions, setDrinkSuggestions] = useState<string[]>([])
  const [symptomSuggestions, setSymptomSuggestions] = useState<SymptomSuggestion[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartedAt = useRef(0)
  const dialogRef = useRef<HTMLElement>(null)
  const dismissTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    setDragOffset(0)
    setIsDragging(false)
    setEntryType(entryToEdit?.entry_type ?? 'SYMPTOM')
    setOccurredAt(
      getLocalDateTimeValue(entryToEdit ? new Date(entryToEdit.occurred_at) : new Date()),
    )
    setNote(entryToEdit?.note ?? '')
    setMealType(entryToEdit?.food_entries?.meal_type ?? getSuggestedMealType())
    setFoodItems(
      entryToEdit?.food_entries?.food_entry_items.length
        ? entryToEdit.food_entries.food_entry_items.map((item) => ({
            id: item.id,
            name: item.custom_name ?? '',
            amount: item.amount?.toString() ?? '',
            unit: item.unit ?? '',
          }))
        : getInitialFoodItems(),
    )
    setStool(
      entryToEdit?.stool_entries
        ? {
            consistency: entryToEdit.stool_entries.consistency,
            bristolScale: entryToEdit.stool_entries.bristol_scale?.toString() ?? '',
            amount: entryToEdit.stool_entries.amount ?? '',
            urgency: entryToEdit.stool_entries.urgency?.toString() ?? '0',
            painLevel: entryToEdit.stool_entries.pain_level?.toString() ?? '0',
            color: entryToEdit.stool_entries.color ?? '',
            blood: entryToEdit.stool_entries.blood,
            mucus: entryToEdit.stool_entries.mucus,
            unusualSmell: entryToEdit.stool_entries.unusual_smell ?? false,
            completeEvacuation: entryToEdit.stool_entries.complete_evacuation,
          }
        : { ...INITIAL_STOOL_DRAFT },
    )
    setDrink(
      entryToEdit?.drink_entries
        ? {
            name: entryToEdit.drink_entries.drink_name,
            amountMl: entryToEdit.drink_entries.amount_ml?.toString() ?? '',
            caffeineMg: entryToEdit.drink_entries.caffeine_mg?.toString() ?? '',
            alcoholPercent: entryToEdit.drink_entries.alcohol_percent?.toString() ?? '',
          }
        : { ...INITIAL_DRINK_DRAFT },
    )
    if (entryToEdit?.sleep_entries?.sleep_ended_at) {
      const durationMinutes = Math.round(
        (new Date(entryToEdit.sleep_entries.sleep_ended_at).getTime() -
          new Date(entryToEdit.sleep_entries.sleep_started_at).getTime()) /
          60_000,
      )
      setSleep({
        hours: Math.floor(durationMinutes / 60).toString(),
        minutes: (durationMinutes % 60).toString(),
        quality: entryToEdit.sleep_entries.quality?.toString() ?? '',
        interruptions: entryToEdit.sleep_entries.interruptions?.toString() ?? '0',
      })
    } else {
      setSleep({ ...INITIAL_SLEEP_DRAFT })
    }
    setSymptom(
      entryToEdit?.symptom_entries
        ? {
            name:
              entryToEdit.symptom_entries.symptoms?.name ??
              entryToEdit.symptom_entries.custom_name ??
              '',
            severity: entryToEdit.symptom_entries.severity.toString(),
            durationMinutes: entryToEdit.symptom_entries.duration_minutes?.toString() ?? '',
            bodyArea: entryToEdit.symptom_entries.body_area ?? '',
          }
        : { ...INITIAL_SYMPTOM_DRAFT },
    )
    setMedication(
      entryToEdit?.medication_entries
        ? {
            medicationId: entryToEdit.medication_entries.medication_id,
            dose: entryToEdit.medication_entries.dose?.toString() ?? '',
            doseUnit: entryToEdit.medication_entries.dose_unit ?? '',
            takenAsNeeded: entryToEdit.medication_entries.taken_as_needed,
          }
        : { ...INITIAL_MEDICATION_DRAFT },
    )
    setBodyMeasurement(
      entryToEdit?.body_measurements
        ? {
            weightKg: entryToEdit.body_measurements.weight_kg?.toString() ?? '',
            temperatureCelsius: entryToEdit.body_measurements.temperature_celsius?.toString() ?? '',
            pulseBpm: entryToEdit.body_measurements.pulse_bpm?.toString() ?? '',
            systolicBloodPressure:
              entryToEdit.body_measurements.systolic_blood_pressure?.toString() ?? '',
            diastolicBloodPressure:
              entryToEdit.body_measurements.diastolic_blood_pressure?.toString() ?? '',
          }
        : { ...INITIAL_BODY_MEASUREMENT_DRAFT },
    )
    setUrination(
      entryToEdit?.urination_entries
        ? {
            amount: entryToEdit.urination_entries.amount ?? '',
            color: entryToEdit.urination_entries.color ?? '',
            urgency: entryToEdit.urination_entries.urgency?.toString() ?? '0',
            painLevel: entryToEdit.urination_entries.pain_level?.toString() ?? '0',
            burning: entryToEdit.urination_entries.burning,
            nighttime: entryToEdit.urination_entries.nighttime,
          }
        : { ...INITIAL_URINATION_DRAFT },
    )
    setError(null)
    void getTrackingSuggestions()
      .then((suggestions) => {
        setDrinkSuggestions(suggestions.drinks)
        setSymptomSuggestions(suggestions.symptoms)
        setMedications(suggestions.medications)
      })
      .catch(() => {
        setDrinkSuggestions(['Wasser', 'Kaffee', 'Tee', 'Mineralwasser', 'Saft'])
      })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const scrollPosition = window.scrollY
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.width = '100%'
    requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }))
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      if (dismissTimer.current !== null) window.clearTimeout(dismissTimer.current)
      document.body.style.overflow = previousBodyStyles.overflow
      document.body.style.position = previousBodyStyles.position
      document.body.style.top = previousBodyStyles.top
      document.body.style.width = previousBodyStyles.width
      window.scrollTo(0, scrollPosition)
      previouslyFocusedElement?.focus({ preventScroll: true })
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, entryToEdit])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    let details: TrackingEntryDetails | undefined

    if (entryType === 'FOOD') {
      const validItems = foodItems.filter((item) => item.name.trim())
      if (validItems.length !== foodItems.length || validItems.length === 0) {
        setError('Bitte beschreibe jede Essensposition oder entferne leere Positionen.')
        return
      }
      details = {
        kind: 'FOOD',
        mealType,
        items: validItems.map((item) => ({
          name: item.name,
          amount: item.amount && Number(item.amount) > 0 ? Number(item.amount) : null,
          unit: item.unit,
        })),
      }
    }

    if (entryType === 'STOOL') {
      details = {
        kind: 'STOOL',
        consistency: stool.consistency,
        bristolScale: stool.bristolScale ? Number(stool.bristolScale) : null,
        amount: stool.amount || null,
        urgency: stool.urgency ? Number(stool.urgency) : null,
        painLevel: stool.painLevel ? Number(stool.painLevel) : 0,
        blood: stool.blood,
        mucus: stool.mucus,
        color: stool.color,
        unusualSmell: stool.unusualSmell,
        completeEvacuation: stool.completeEvacuation,
      }
    }

    if (entryType === 'DRINK') {
      if (!drink.name.trim()) {
        setError('Bitte wähle ein Getränk oder gib einen eigenen Namen ein.')
        return
      }
      details = {
        kind: 'DRINK',
        name: drink.name,
        amountMl: drink.amountMl ? Number(drink.amountMl) : null,
        caffeineMg: drink.caffeineMg ? Number(drink.caffeineMg) : null,
        alcoholPercent: drink.alcoholPercent ? Number(drink.alcoholPercent) : null,
      }
    }

    if (entryType === 'SLEEP') {
      const durationMinutes = Number(sleep.hours || 0) * 60 + Number(sleep.minutes || 0)
      if (durationMinutes <= 0) {
        setError('Bitte gib eine Schlafdauer an.')
        return
      }
      details = {
        kind: 'SLEEP',
        durationMinutes,
        quality: sleep.quality ? Number(sleep.quality) : null,
        interruptions: sleep.interruptions ? Number(sleep.interruptions) : 0,
      }
    }

    if (entryType === 'SYMPTOM') {
      if (!symptom.name.trim()) {
        setError('Bitte wähle ein Symptom oder gib einen eigenen Namen ein.')
        return
      }
      const matchingSymptom = symptomSuggestions.find(
        (item) =>
          item.name.toLocaleLowerCase('de-CH') === symptom.name.trim().toLocaleLowerCase('de-CH'),
      )
      details = {
        kind: 'SYMPTOM',
        symptomId: matchingSymptom?.id || null,
        customName: symptom.name,
        severity: Number(symptom.severity),
        durationMinutes: symptom.durationMinutes ? Number(symptom.durationMinutes) : null,
        bodyArea: symptom.bodyArea,
      }
    }

    if (entryType === 'MEDICATION') {
      if (!medication.medicationId) {
        setError('Bitte wähle ein Medikament aus deinem Profil aus.')
        return
      }
      details = {
        kind: 'MEDICATION',
        medicationId: medication.medicationId,
        dose: medication.dose ? Number(medication.dose) : null,
        doseUnit: medication.doseUnit,
        takenAsNeeded: medication.takenAsNeeded,
      }
    }

    if (entryType === 'BODY_MEASUREMENT') {
      const hasValue = Object.values(bodyMeasurement).some((value) => value !== '')
      if (!hasValue) {
        setError('Bitte gib mindestens einen Körperwert ein.')
        return
      }
      details = {
        kind: 'BODY_MEASUREMENT',
        weightKg: bodyMeasurement.weightKg ? Number(bodyMeasurement.weightKg) : null,
        temperatureCelsius: bodyMeasurement.temperatureCelsius
          ? Number(bodyMeasurement.temperatureCelsius)
          : null,
        pulseBpm: bodyMeasurement.pulseBpm ? Number(bodyMeasurement.pulseBpm) : null,
        systolicBloodPressure: bodyMeasurement.systolicBloodPressure
          ? Number(bodyMeasurement.systolicBloodPressure)
          : null,
        diastolicBloodPressure: bodyMeasurement.diastolicBloodPressure
          ? Number(bodyMeasurement.diastolicBloodPressure)
          : null,
      }
    }

    if (entryType === 'URINATION') {
      details = {
        kind: 'URINATION',
        amount: urination.amount || null,
        color: urination.color,
        urgency: urination.urgency ? Number(urination.urgency) : 0,
        painLevel: urination.painLevel ? Number(urination.painLevel) : 0,
        burning: urination.burning,
        nighttime: urination.nighttime,
      }
    }

    setIsSubmitting(true)

    try {
      const entryInput = { entryType, occurredAt: new Date(occurredAt), note, details }
      if (entryToEdit) {
        await updateTrackingEntry(entryToEdit.id, entryInput)
      } else {
        await createTrackingEntry(entryInput)
      }
      setNote('')
      setFoodItems(getInitialFoodItems())
      setStool({ ...INITIAL_STOOL_DRAFT })
      setDrink({ ...INITIAL_DRINK_DRAFT })
      setSleep({ ...INITIAL_SLEEP_DRAFT })
      setSymptom({ ...INITIAL_SYMPTOM_DRAFT })
      setMedication({ ...INITIAL_MEDICATION_DRAFT })
      setBodyMeasurement({ ...INITIAL_BODY_MEASUREMENT_DRAFT })
      setUrination({ ...INITIAL_URINATION_DRAFT })
      onCreated()
      onClose()
    } catch {
      setError('Der Eintrag konnte nicht gespeichert werden. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.innerWidth >= 640 || isSubmitting) return
    dragStartY.current = event.clientY
    dragStartedAt.current = performance.now()
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    setDragOffset(Math.max(0, event.clientY - dragStartY.current))
  }

  function handleDragEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    const finalOffset = Math.max(0, event.clientY - dragStartY.current)
    const elapsed = Math.max(performance.now() - dragStartedAt.current, 1)
    const velocity = finalOffset / elapsed
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (finalOffset > 110 || (finalOffset > 36 && velocity > 0.65)) {
      setDragOffset(window.innerHeight)
      dismissTimer.current = window.setTimeout(onClose, 220)
      return
    }

    setDragOffset(0)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-6"
      style={{
        backgroundColor: `rgba(20, 17, 15, ${0.45 * (1 - Math.min(dragOffset / 420, 1))})`,
      }}
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target && !isSubmitting) onClose()
      }}
    >
      <section
        className={`flex min-w-0 max-h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-khaki-beige-50 shadow-2xl sm:max-h-[92svh] sm:max-w-2xl sm:rounded-3xl ${
          isDragging ? '' : 'transition-transform duration-300 ease-out'
        }`}
        style={{ transform: `translate3d(0, ${dragOffset}px, 0)` }}
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-busy={isSubmitting}
        aria-modal="true"
        aria-labelledby="new-entry-title"
      >
        <div
          className="flex h-8 shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing sm:hidden"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          aria-hidden="true"
        >
          <span className="h-1.5 w-11 rounded-full bg-dusty-taupe-300" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 sm:px-7 sm:pt-7">
          <div>
            <p className="text-sm font-semibold text-chocolate-plum-600">
              {entryToEdit ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
            </p>
            <h2 id="new-entry-title" className="mt-1 text-2xl font-bold text-chocolate-plum-950">
              Was möchtest du festhalten?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full text-dusty-taupe-700 transition hover:bg-dusty-taupe-100 active:bg-dusty-taupe-200"
            aria-label="Dialog schliessen"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <form className="flex min-h-0 min-w-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-6 pt-2 sm:px-7 sm:pt-3">
            <fieldset>
              <legend className="text-sm font-semibold text-ash-brown-800">Kategorie</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 min-[375px]:grid-cols-3">
                {TRACKING_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    disabled={Boolean(entryToEdit)}
                    onClick={() => setEntryType(type.value)}
                    className={`min-h-12 rounded-xl border px-2 py-2 text-sm font-medium transition ${
                      entryType === type.value
                        ? 'border-chocolate-plum-700 bg-chocolate-plum-700 text-white'
                        : 'border-dusty-taupe-200 bg-white text-ash-brown-800 hover:border-dusty-taupe-400 disabled:cursor-not-allowed disabled:opacity-45'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-ash-brown-800">Zeitpunkt</span>
              <input
                type="datetime-local"
                required
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                className="min-w-0 max-w-full w-full rounded-xl border border-dusty-taupe-300 bg-white px-4 py-3 text-ash-brown-950 outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
              />
            </label>

            {entryType === 'FOOD' ? (
              <FoodEntryFields
                mealType={mealType}
                onMealTypeChange={setMealType}
                items={foodItems}
                onItemsChange={setFoodItems}
              />
            ) : null}

            {entryType === 'STOOL' ? <StoolEntryFields value={stool} onChange={setStool} /> : null}

            {entryType === 'DRINK' ? (
              <DrinkEntryFields value={drink} suggestions={drinkSuggestions} onChange={setDrink} />
            ) : null}

            {entryType === 'SLEEP' ? <SleepEntryFields value={sleep} onChange={setSleep} /> : null}

            {entryType === 'SYMPTOM' ? (
              <SymptomEntryFields
                value={symptom}
                suggestions={symptomSuggestions}
                onChange={setSymptom}
              />
            ) : null}

            {entryType === 'MEDICATION' ? (
              <MedicationEntryFields
                value={medication}
                medications={medications}
                onChange={setMedication}
              />
            ) : null}

            {entryType === 'BODY_MEASUREMENT' ? (
              <BodyMeasurementFields value={bodyMeasurement} onChange={setBodyMeasurement} />
            ) : null}

            {entryType === 'URINATION' ? (
              <UrinationEntryFields value={urination} onChange={setUrination} />
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ash-brown-800">
                Notiz (optional)
              </span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Was ist passiert?"
                className="w-full resize-none rounded-xl border border-dusty-taupe-300 bg-white px-4 py-3 text-ash-brown-950 outline-none placeholder:text-dusty-taupe-400 focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100"
              />
            </label>

            {error ? (
              <p
                className="rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-dusty-taupe-200 bg-khaki-beige-50/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-7 sm:pb-7 sm:pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-chocolate-plum-800 px-5 py-3.5 font-semibold text-white transition hover:bg-chocolate-plum-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
              ) : (
                <Plus size={20} aria-hidden="true" />
              )}
              {isSubmitting
                ? 'Wird gespeichert …'
                : entryToEdit
                  ? 'Änderungen speichern'
                  : 'Eintrag speichern'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
