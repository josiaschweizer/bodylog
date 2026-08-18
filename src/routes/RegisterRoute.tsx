import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { getGermanAuthError, registerWithPassword } from '@/methods/auth'

type RegisterErrors = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  passwordConfirmation?: string
}

export default function RegisterRoute() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: RegisterErrors = {}
    if (!firstName.trim()) {
      nextErrors.firstName = 'Bitte gib deinen Vornamen ein.'
    }
    if (!lastName.trim()) {
      nextErrors.lastName = 'Bitte gib deinen Nachnamen ein.'
    }
    if (!email.trim()) {
      nextErrors.email = 'Bitte gib deine E-Mail-Adresse ein.'
    }
    if (password.length < 8) {
      nextErrors.password = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
    }
    if (passwordConfirmation !== password) {
      nextErrors.passwordConfirmation = 'Die Passwörter stimmen nicht überein.'
    }

    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    const { data, error } = await registerWithPassword({
      email,
      password,
      firstName,
      lastName,
    })
    setIsSubmitting(false)

    if (error) {
      setSubmitError(getGermanAuthError(error.message))
      return
    }

    if (data.session) {
      navigate('/', { replace: true })
      return
    }

    setConfirmationEmail(email.trim())
  }

  if (confirmationEmail) {
    return (
      <AuthLayout
        title="Fast geschafft"
        description="Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren."
        footer={
          <Link
            className="font-semibold text-chocolate-plum-700 hover:text-chocolate-plum-900"
            to="/login"
          >
            Zur Anmeldung
          </Link>
        }
      >
        <div className="rounded-2xl border border-dusty-taupe-200 bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-chocolate-plum-700" size={42} aria-hidden="true" />
          <p className="mt-4 font-semibold text-ash-brown-900">Prüfe deinen Posteingang</p>
          <p className="mt-2 text-sm leading-6 text-dusty-taupe-700">
            Wir haben einen Bestätigungslink an <strong>{confirmationEmail}</strong> gesendet.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Konto erstellen"
      description="Starte mit deinem persönlichen BodyLog und behalte deine Gesundheit im Blick."
      footer={
        <>
          Du hast bereits ein Konto?{' '}
          <Link
            className="font-semibold text-chocolate-plum-700 hover:text-chocolate-plum-900"
            to="/login"
          >
            Jetzt anmelden
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="first-name"
            label="Vorname"
            autoComplete="given-name"
            placeholder="Anna"
            value={firstName}
            error={errors.firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <FormField
            id="last-name"
            label="Nachname"
            autoComplete="family-name"
            placeholder="Muster"
            value={lastName}
            error={errors.lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <FormField
          id="register-email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.ch"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          id="register-password"
          label="Passwort"
          type="password"
          autoComplete="new-password"
          placeholder="Mindestens 8 Zeichen"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormField
          id="password-confirmation"
          label="Passwort bestätigen"
          type="password"
          autoComplete="new-password"
          placeholder="Passwort wiederholen"
          value={passwordConfirmation}
          error={errors.passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-chocolate-plum-800 px-5 py-3.5 font-semibold text-white transition hover:bg-chocolate-plum-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chocolate-plum-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
          ) : (
            <ArrowRight size={20} aria-hidden="true" />
          )}
          {isSubmitting ? 'Konto wird erstellt …' : 'Konto erstellen'}
        </button>
      </form>
    </AuthLayout>
  )
}
