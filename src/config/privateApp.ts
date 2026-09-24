/**
 * Cash Prophet runs as a private personal tool (no public product / signup / billing).
 * Set VITE_PRIVATE_ALLOWED_EMAILS to a comma-separated allowlist (lowercase comparison).
 * Also disable new sign-ups in the Supabase Auth dashboard.
 */
export const PRIVATE_PERSONAL_APP = true

/** Emails allowed to sign in. Empty list = do not client-block logins (still block signup). */
export function getAllowedEmails(): string[] {
  const raw = import.meta.env.VITE_PRIVATE_ALLOWED_EMAILS as string | undefined
  if (!raw || typeof raw !== 'string') return []
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  const list = getAllowedEmails()
  if (list.length === 0) return true
  if (!email) return false
  return list.includes(email.trim().toLowerCase())
}

export const SIGNUP_DISABLED_MESSAGE =
  'New accounts are not available. This is a private workspace.'

export const LOGIN_DENIED_MESSAGE =
  'This account is not authorised to use this workspace.'
