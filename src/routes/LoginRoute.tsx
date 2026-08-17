import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { getGermanAuthError, loginWithPassword } from '@/methods/auth'

type LoginErrors = {
  email?: string
  password?: string
}

export default function LoginRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: LoginErrors = {}
    if (!email.trim()) nextErrors.email = 'Bitte gib deine E-Mail-Adresse ein.'
    if (!password) nextErrors.password = 'Bitte gib dein Passwort ein.'

    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    const { data, error } = await loginWithPassword(email, password)
    setIsSubmitting(false)

    if (error) {
      setSubmitError(getGermanAuthError(error.message))
      return
    }

    if (data.session) navigate('/', { replace: true })
  }

  return (
    <AuthLayout
      title="Willkommen zurück"
      description="Melde dich an, um deine Einträge und Auswertungen zu öffnen."
      footer={
        <>
          Noch kein Konto?{' '}
          <Link className="font-semibold text-chocolate-plum-700 hover:text-chocolate-plum-900" to="/register">
            Jetzt registrieren
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {location.state?.passwordReset ? (
          <p className="rounded-xl border border-khaki-beige-300 bg-khaki-beige-100 px-4 py-3 text-sm text-khaki-beige-800" role="status">
            Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.
          </p>
        ) : null}
        <FormField
          id="login-email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.ch"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          id="login-password"
          label="Passwort"
          type="password"
          autoComplete="current-password"
          placeholder="Dein Passwort"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="-mt-2 text-right">
          <Link className="text-sm font-semibold text-chocolate-plum-700 hover:text-chocolate-plum-900" to="/forgot-password">
            Passwort vergessen?
          </Link>
        </div>

        {submitError ? (
          <p className="rounded-xl border border-chocolate-plum-200 bg-chocolate-plum-50 px-4 py-3 text-sm text-chocolate-plum-800" role="alert">
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
          {isSubmitting ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>
    </AuthLayout>
  )
}
