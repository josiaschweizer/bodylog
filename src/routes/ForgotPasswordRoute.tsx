import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, LoaderCircle, MailCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { getGermanAuthError, requestPasswordReset } from '@/methods/auth'

export default function ForgotPasswordRoute() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setEmailError('Bitte gib deine E-Mail-Adresse ein.')
      return
    }

    setEmailError(undefined)
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const { error } = await requestPasswordReset(normalizedEmail)
      if (error) {
        setSubmitError(getGermanAuthError(error.message))
        return
      }
      setSubmittedEmail(normalizedEmail)
    } catch {
      setSubmitError('Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedEmail) {
    return (
      <AuthLayout
        title="Prüfe deinen Posteingang"
        description="Wenn ein Konto zu dieser Adresse existiert, erhältst du einen Link zum Zurücksetzen."
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
          <MailCheck className="mx-auto text-chocolate-plum-700" size={42} aria-hidden="true" />
          <p className="mt-4 font-semibold text-ash-brown-900">E-Mail wurde angefordert</p>
          <p className="mt-2 text-sm leading-6 text-dusty-taupe-700">
            Öffne den Link in der E-Mail an <strong>{submittedEmail}</strong>. Er ist nur für
            begrenzte Zeit gültig.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Passwort zurücksetzen"
      description="Gib die E-Mail-Adresse deines BodyLog-Kontos ein."
      footer={
        <Link
          className="inline-flex items-center gap-1.5 font-semibold text-chocolate-plum-700 hover:text-chocolate-plum-900"
          to="/login"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Zurück zur Anmeldung
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          id="reset-email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.ch"
          value={email}
          error={emailError}
          onChange={(event) => setEmail(event.target.value)}
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
          ) : null}
          {isSubmitting ? 'Wird gesendet …' : 'Link anfordern'}
        </button>
      </form>
    </AuthLayout>
  )
}
