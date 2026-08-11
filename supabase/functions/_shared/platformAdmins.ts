/** Who may attempt platform admin login (must also be in platform_admins + 2FA). */

const ADMIN_EMAIL_DOMAIN = '@vocatio.io'

const EXTRA_PLATFORM_ADMIN_EMAILS = ['dave@lasertagleisure.co.uk'] as const

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isAllowedPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = normalizeAdminEmail(email)
  if (normalized.endsWith(ADMIN_EMAIL_DOMAIN)) return true
  return (EXTRA_PLATFORM_ADMIN_EMAILS as readonly string[]).includes(normalized)
}
