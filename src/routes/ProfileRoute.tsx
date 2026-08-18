import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  CircleUserRound,
  Clock3,
  GlassWater,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Tablets,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import getBrowserClient from '@/lib/supabase/getBrowserClient'
import type { MedicationForm } from '@/lib/tracking'
import {
  createMedication,
  deactivateMedication,
  deleteAccount,
  getMedications,
  getProfilePreferences,
  updateProfilePreferences,
  updateMedication,
} from '@/methods/profile'
import type { MedicationWithSchedules } from '@/methods/profile'

const MEDICATION_FORMS: Array<{ value: MedicationForm; label: string }> = [
  { value: 'TABLET', label: 'Tablette' },
  { value: 'CAPSULE', label: 'Kapsel' },
  { value: 'DROPS', label: 'Tropfen' },
  { value: 'LIQUID', label: 'Flüssigkeit' },
  { value: 'POWDER', label: 'Pulver' },
  { value: 'SPRAY', label: 'Spray' },
  { value: 'INJECTION', label: 'Injektion' },
  { value: 'SUPPOSITORY', label: 'Zäpfchen' },
  { value: 'OTHER', label: 'Andere Form' },
]

export default function ProfileRoute() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [medications, setMedications] = useState<MedicationWithSchedules[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)
  const [defaultDrinkAmountMl, setDefaultDrinkAmountMl] = useState('500')
  const [name, setName] = useState('')
  const [activeIngredient, setActiveIngredient] = useState('')
  const [strength, setStrength] = useState('')
  const [strengthUnit, setStrengthUnit] = useState('mg')
  const [form, setForm] = useState<MedicationForm>('TABLET')
  const [defaultDose, setDefaultDose] = useState('1')
  const [defaultDoseUnit, setDefaultDoseUnit] = useState('Tablette')
  const [scheduledTime, setScheduledTime] = useState('')
  const [notes, setNotes] = useState('')

  function loadMedications() {
    setIsLoading(true)
    void getMedications()
      .then(setMedications)
      .catch(() => setError('Die Medikamente konnten nicht geladen werden.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadMedications, [])

  useEffect(() => {
    void getProfilePreferences()
      .then((preferences) => {
        setDefaultDrinkAmountMl(preferences.default_drink_amount_ml.toString())
      })
      .catch(() => {
        setPreferencesError('Die Profileinstellungen konnten nicht geladen werden.')
      })
      .finally(() => {
        setIsLoadingPreferences(false)
      })
  }, [])

  function resetForm() {
    setName('')
    setActiveIngredient('')
    setStrength('')
    setStrengthUnit('mg')
    setForm('TABLET')
    setDefaultDose('1')
    setDefaultDoseUnit('Tablette')
    setScheduledTime('')
    setNotes('')
    setEditingMedicationId(null)
  }

  function handleToggleCreateForm() {
    if (isFormOpen && !editingMedicationId) {
      setIsFormOpen(false)
      resetForm()
      return
    }

    resetForm()
    setIsFormOpen(true)
  }

  function handleEdit(medication: MedicationWithSchedules) {
    const schedule = medication.medication_schedules.find((item) => item.is_active)
    setName(medication.name)
    setActiveIngredient(medication.active_ingredient ?? '')
    setStrength(medication.strength?.toString() ?? '')
    setStrengthUnit(medication.strength_unit ?? 'mg')
    setForm(medication.form)
    setDefaultDose(medication.default_dose?.toString() ?? '')
    setDefaultDoseUnit(medication.default_dose_unit ?? '')
    setScheduledTime(schedule?.scheduled_time?.slice(0, 5) ?? '')
    setNotes(medication.notes ?? '')
    setEditingMedicationId(medication.id)
    setIsFormOpen(true)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const scheduleId = editingMedicationId
        ? medications
            .find((item) => item.id === editingMedicationId)
            ?.medication_schedules.find((item) => item.is_active)?.id
        : null
      const input = {
        name,
        activeIngredient,
        strength: strength ? Number(strength) : null,
        strengthUnit,
        form,
        defaultDose: defaultDose ? Number(defaultDose) : null,
        defaultDoseUnit,
        scheduledTime,
        scheduleId,
        notes,
      }

      if (editingMedicationId) {
        await updateMedication(editingMedicationId, input)
      } else {
        await createMedication(input)
      }

      resetForm()
      setIsFormOpen(false)
      loadMedications()
    } catch {
      setError('Das Medikament konnte nicht gespeichert werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateMedication(id)
      setMedications((current) => current.filter((item) => item.id !== id))
    } catch {
      setError('Das Medikament konnte nicht entfernt werden.')
    }
  }

  async function handleLogout() {
    setIsSigningOut(true)
    setLogoutError(null)

    try {
      const { error: signOutError } = await getBrowserClient().auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Du konntest nicht abgemeldet werden. Bitte versuche es erneut.')
      setIsSigningOut(false)
    }
  }

  async function handleSavePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(defaultDrinkAmountMl)

    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
      setPreferencesError('Bitte gib eine Menge zwischen 1 und 10’000 ml ein.')
      setPreferencesSuccess(false)
      return
    }

    setIsSavingPreferences(true)
    setPreferencesError(null)
    setPreferencesSuccess(false)

    try {
      await updateProfilePreferences(amount)
      setPreferencesSuccess(true)
    } catch {
      setPreferencesError('Die Profileinstellung konnte nicht gespeichert werden.')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (deleteConfirmation !== 'LÖSCHEN') {
      return
    }

    setIsDeletingAccount(true)
    setDeleteError(null)

    try {
      await deleteAccount()
      navigate('/register', { replace: true })
    } catch {
      setDeleteError('Dein Konto konnte nicht gelöscht werden. Bitte versuche es erneut.')
      setIsDeletingAccount(false)
    }
  }

  function closeDeleteDialog() {
    if (isDeletingAccount) {
      return
    }
    setIsDeleteDialogOpen(false)
    setDeleteConfirmation('')
    setDeleteError(null)
  }

  const fieldClass =
    'w-full rounded-xl border border-dusty-taupe-300 bg-white px-3 py-3 text-sm outline-none focus:border-chocolate-plum-500 focus:ring-4 focus:ring-chocolate-plum-100'

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 lg:px-10 lg:pb-10 lg:pt-10">
      <header>
        <p className="text-sm font-semibold text-chocolate-plum-600">Konto und Einstellungen</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-chocolate-plum-950 sm:text-4xl">
          Profil
        </h1>
      </header>

      <section className="mt-8 flex items-center gap-4 rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm">
        <span className="grid size-12 place-items-center rounded-full bg-chocolate-plum-100 text-chocolate-plum-700">
          <CircleUserRound size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="font-bold text-ash-brown-900">
            {user?.user_metadata.first_name} {user?.user_metadata.last_name}
          </p>
          <p className="text-sm text-dusty-taupe-600">{user?.email}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-chocolate-plum-100 text-chocolate-plum-700">
            <GlassWater size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-chocolate-plum-950">Getränkeeinstellungen</h2>
            <p className="mt-1 text-sm leading-6 text-dusty-taupe-600">
              Diese Menge wird bei neuen Getränken automatisch vorgeschlagen.
            </p>
          </div>
        </div>

        <form className="mt-5" onSubmit={handleSavePreferences}>
          <label className="block max-w-sm">
            <span className="mb-2 block text-sm font-semibold text-ash-brown-900">
              Standardmenge (ml)
            </span>
            <input
              type="number"
              min="1"
              max="10000"
              step="10"
              required
              value={defaultDrinkAmountMl}
              onChange={(event) => {
                setDefaultDrinkAmountMl(event.target.value)
                setPreferencesSuccess(false)
              }}
              disabled={isLoadingPreferences || isSavingPreferences}
              className={fieldClass}
            />
            <span className="mt-2 block text-xs text-dusty-taupe-600">
              Beispiel: Eine 50-cl-Flasche entspricht 500 ml.
            </span>
          </label>

          {preferencesError ? (
            <p
              className="mt-4 rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800"
              role="alert"
            >
              {preferencesError}
            </p>
          ) : null}
          {preferencesSuccess ? (
            <p className="mt-4 text-sm font-semibold text-chocolate-plum-700" role="status">
              Standardmenge gespeichert.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoadingPreferences || isSavingPreferences}
            className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-chocolate-plum-800 px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {isSavingPreferences ? (
              <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
            ) : (
              <GlassWater size={20} aria-hidden="true" />
            )}
            {isSavingPreferences ? 'Wird gespeichert …' : 'Standardmenge speichern'}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-chocolate-plum-950">Meine Medikamente</h2>
            <p className="mt-1 text-sm text-dusty-taupe-600">
              Diese Medikamente erscheinen in deiner Schnellauswahl.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleCreateForm}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-chocolate-plum-800 text-white"
            aria-label={
              isFormOpen && !editingMedicationId ? 'Formular schließen' : 'Medikament hinzufügen'
            }
          >
            {isFormOpen && !editingMedicationId ? <X size={21} /> : <Plus size={21} />}
          </button>
        </div>

        {isFormOpen ? (
          <form className="mt-6 rounded-2xl bg-khaki-beige-50 p-4 sm:p-5" onSubmit={handleSubmit}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-bold text-chocolate-plum-950">
                {editingMedicationId ? 'Medikament bearbeiten' : 'Medikament hinzufügen'}
              </h3>
              {editingMedicationId ? (
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsFormOpen(false)
                  }}
                  className="grid size-9 place-items-center rounded-lg text-dusty-taupe-500 hover:bg-chocolate-plum-100"
                  aria-label="Bearbeiten abbrechen"
                >
                  <X size={19} />
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-semibold">Name *</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="z. B. Ibuprofen"
                  className={fieldClass}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Wirkstoff</span>
                <input
                  value={activeIngredient}
                  onChange={(event) => setActiveIngredient(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Stärke</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={strength}
                    onChange={(event) => setStrength(event.target.value)}
                    className={fieldClass}
                  />
                  <input
                    value={strengthUnit}
                    onChange={(event) => setStrengthUnit(event.target.value)}
                    placeholder="mg"
                    className={fieldClass}
                  />
                </div>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Form</span>
                <select
                  value={form}
                  onChange={(event) => setForm(event.target.value as MedicationForm)}
                  className={fieldClass}
                >
                  {MEDICATION_FORMS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold">Standarddosis</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={defaultDose}
                    onChange={(event) => setDefaultDose(event.target.value)}
                    className={fieldClass}
                  />
                  <input
                    value={defaultDoseUnit}
                    onChange={(event) => setDefaultDoseUnit(event.target.value)}
                    className={fieldClass}
                  />
                </div>
              </label>
              <label className="min-w-0">
                <span className="mb-2 block text-sm font-semibold">Tägliche Einnahmezeit</span>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                  className={`${fieldClass} min-w-0 max-w-full`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Hinweise</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 flex items-center gap-2 rounded-xl bg-chocolate-plum-800 px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" size={19} />
              ) : editingMedicationId ? (
                <Pencil size={19} />
              ) : (
                <Plus size={19} />
              )}
              {editingMedicationId ? 'Änderungen speichern' : 'Speichern'}
            </button>
          </form>
        ) : null}

        {error ? (
          <p
            className="mt-5 rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-dusty-taupe-600">
              Medikamente werden geladen …
            </p>
          ) : null}
          {!isLoading && medications.length === 0 ? (
            <p className="rounded-xl bg-khaki-beige-50 px-4 py-8 text-center text-sm text-dusty-taupe-600">
              Noch keine Medikamente hinterlegt.
            </p>
          ) : null}
          {medications.map((medication) => (
            <article
              key={medication.id}
              className="flex items-start gap-4 rounded-xl border border-dusty-taupe-200 p-4"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-chocolate-plum-100 text-chocolate-plum-700">
                <Tablets size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ash-brown-900">{medication.name}</p>
                <p className="mt-1 text-sm text-dusty-taupe-600">
                  {[
                    medication.active_ingredient,
                    medication.strength
                      ? `${medication.strength} ${medication.strength_unit ?? ''}`
                      : null,
                    medication.default_dose
                      ? `${medication.default_dose} ${medication.default_dose_unit ?? ''}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {medication.medication_schedules
                  .filter((schedule) => schedule.is_active)
                  .map((schedule) => (
                    <p
                      key={schedule.id}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-chocolate-plum-700"
                    >
                      <Clock3 size={14} /> täglich um {schedule.scheduled_time?.slice(0, 5)}
                    </p>
                  ))}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(medication)}
                  className="grid size-11 place-items-center rounded-xl text-dusty-taupe-500 hover:bg-chocolate-plum-100 hover:text-chocolate-plum-700 active:bg-chocolate-plum-200"
                  aria-label={`${medication.name} bearbeiten`}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeactivate(medication.id)}
                  className="grid size-11 place-items-center rounded-xl text-dusty-taupe-500 hover:bg-chocolate-plum-100 hover:text-chocolate-plum-700 active:bg-chocolate-plum-200"
                  aria-label={`${medication.name} entfernen`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-dusty-taupe-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-chocolate-plum-950">Konto</h2>
        <p className="mt-1 text-sm text-dusty-taupe-600">
          Beende deine aktuelle Sitzung auf diesem Gerät.
        </p>
        {logoutError ? (
          <p
            className="mt-4 rounded-xl bg-chocolate-plum-100 px-4 py-3 text-sm text-chocolate-plum-800"
            role="alert"
          >
            {logoutError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isSigningOut}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-chocolate-plum-200 bg-white px-5 py-3 font-semibold text-chocolate-plum-800 transition active:scale-[0.98] active:bg-chocolate-plum-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {isSigningOut ? (
            <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
          ) : (
            <LogOut size={20} aria-hidden="true" />
          )}
          {isSigningOut ? 'Wird abgemeldet …' : 'Abmelden'}
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-red-900">Konto löschen</h2>
        <p className="mt-1 text-sm leading-6 text-red-800">
          Löscht dein Profil sowie alle erfassten Einträge, Medikamente und übrigen persönlichen
          Daten dauerhaft.
        </p>
        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-800 transition active:scale-[0.98] active:bg-red-50 sm:w-auto"
        >
          <Trash2 size={20} aria-hidden="true" />
          Konto dauerhaft löschen
        </button>
      </section>

      {isDeleteDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onPointerDown={(event) => {
            if (event.currentTarget === event.target) {
              closeDeleteDialog()
            }
          }}
        >
          <section
            className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
                <AlertTriangle size={23} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="delete-account-title" className="text-xl font-bold text-red-950">
                  Konto wirklich löschen?
                </h2>
                <p className="mt-2 text-sm leading-6 text-red-900">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle mit deinem Konto
                  verbundenen Daten werden dauerhaft gelöscht.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeletingAccount}
                className="grid size-10 shrink-0 place-items-center rounded-full text-dusty-taupe-600 hover:bg-dusty-taupe-100 disabled:opacity-50"
                aria-label="Dialog schließen"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6" onSubmit={handleDeleteAccount}>
              <label>
                <span className="mb-2 block text-sm font-semibold text-ash-brown-900">
                  Gib zur Bestätigung LÖSCHEN ein
                </span>
                <input
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  disabled={isDeletingAccount}
                  autoComplete="off"
                  className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:opacity-60"
                />
              </label>

              {deleteError ? (
                <p
                  className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-900"
                  role="alert"
                >
                  {deleteError}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  disabled={isDeletingAccount}
                  className="min-h-12 rounded-xl border border-dusty-taupe-300 px-5 py-3 font-semibold text-ash-brown-800 disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmation !== 'LÖSCHEN' || isDeletingAccount}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isDeletingAccount ? (
                    <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
                  ) : (
                    <Trash2 size={20} aria-hidden="true" />
                  )}
                  {isDeletingAccount ? 'Konto wird gelöscht …' : 'Endgültig löschen'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}
