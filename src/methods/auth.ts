import getBrowserClient from '@/lib/supabase/getBrowserClient'

type RegisterCredentials = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export async function loginWithPassword(email: string, password: string) {
  return getBrowserClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
}

export async function registerWithPassword({
  email,
  password,
  firstName,
  lastName,
}: RegisterCredentials) {
  return getBrowserClient().auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      },
    },
  })
}

export async function requestPasswordReset(email: string) {
  return getBrowserClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function updatePassword(password: string) {
  return getBrowserClient().auth.updateUser({ password })
}

export function getGermanAuthError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'E-Mail-Adresse oder Passwort ist nicht korrekt.'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.'
  }

  if (normalizedMessage.includes('user already registered')) {
    return 'Für diese E-Mail-Adresse existiert bereits ein Konto.'
  }

  if (normalizedMessage.includes('password should be')) {
    return 'Das Passwort erfüllt die Sicherheitsanforderungen nicht.'
  }

  if (normalizedMessage.includes('rate limit')) {
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
  }

  return 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'
}
