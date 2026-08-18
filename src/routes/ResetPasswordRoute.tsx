import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import getBrowserClient from '@/lib/supabase/getBrowserClient'
import { getGermanAuthError, updatePassword } from '@/methods/auth'

type PasswordErrors = {
  password?: string
  confirmation?: string
}

export default function ResetPasswordRoute() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCheckingLink, setIsCheckingLink] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const supabase = getBrowserClient()
    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }
      setIsValidSession(Boolean(data.session))
      setIsCheckingLink(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsValidSession(true)
        setIsCheckingLink(false)
      }
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: PasswordErrors = {}
    if (password.length < 8) {
      nextErrors.password = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
    }
    if (confirmation !== password) {
      nextErrors.confirmation = 'Die Passwörter stimmen nicht überein.'
    }

    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await updatePassword(password)
      if (error) {
        setSubmitError(getGermanAuthError(error.message))
        return
      }

      await getBrowserClient().auth.signOut()
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch {
      setSubmitError(
        'Das Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingLink) {
    return (
      <AuthLayout title="Link wird geprüft" description="Einen Moment bitte." footer={null}>
        <div className="flex justify-center py-10 text-chocolate-plum-700">
          <LoaderCircle className="animate-spin" size={34} aria-label="Wird geladen" />
        </div>
      </AuthLayout>
    )
  }

  if (!isValidSession) {
    return (
      <AuthLayout
        title="Link nicht mehr gültig"
        description="Der Link ist abgelaufen, wurde bereits verwendet oder ist unvollständig."
        footer={
          <Link
            className="font-semibold text-chocolate-plum-700 hover:text-chocolate-plum-900"
            to="/login"
          >
            Zurück zur Anmeldung
          </Link>
        }
      >
        <div className="rounded-2xl border border-dusty-taupe-200 bg-white p-6 text-center shadow-sm">
          <KeyRound className="mx-auto text-chocolate-plum-700" size={40} aria-hidden="true" />
          <p className="mt-4 text-sm leading-6 text-dusty-taupe-700">
            Fordere einen neuen Link an, um dein Passwort zurückzusetzen.
          </p>
          <Link
            to="/forgot-password"
            className="mt-5 inline-flex rounded-xl bg-chocolate-plum-800 px-5 py-3 font-semibold text-white hover:bg-chocolate-plum-900"
          >
            Neuen Link anfordern
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Neues Passwort"
      description="Lege ein neues Passwort mit mindestens acht Zeichen fest."
      footer={null}
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          id="new-password"
          label="Neues Passwort"
          type="password"
          autoComplete="new-password"
          placeholder="Mindestens 8 Zeichen"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormField
          id="new-password-confirmation"
          label="Passwort bestätigen"
          type="password"
          autoComplete="new-password"
          placeholder="Passwort wiederholen"
          value={confirmation}
          error={errors.confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />

        {submitError ? (
          <p
            className="rounded-xl border border-chocolate-plum-200 bg-chocolate-plum-50 px-4 py-3 text-sm text-chocolate-plum-800"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-chocolate-plum-800 px-5 py-3.5 font-semibold text-white transition hover:bg-chocolate-plum-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
          ) : (
            <KeyRound size={20} aria-hidden="true" />
          )}
          {isSubmitting ? 'Passwort wird geändert …' : 'Passwort speichern'}
        </button>
      </form>
    </AuthLayout>
  )
}
