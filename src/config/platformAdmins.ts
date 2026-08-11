/**
 * Who may attempt platform admin login.
 * Still must be enrolled in `platform_admins` and complete 2FA.
 */

const ADMIN_EMAIL_DOMAIN = '@vocatio.io'

/** Extra operator emails outside the Vocatio domain (normalised lowercase). */
export const EXTRA_PLATFORM_ADMIN_EMAILS = ['dave@lasertagleisure.co.uk'] as const

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isAllowedPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = normalizeAdminEmail(email)
  if (normalized.endsWith(ADMIN_EMAIL_DOMAIN)) return true
  return (EXTRA_PLATFORM_ADMIN_EMAILS as readonly string[]).includes(normalized)
}
