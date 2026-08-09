/** Shared Cash Prophet product email HTML for Edge Functions. */

export type ProductEmailKey =
  | 'welcome'
  | 'mid_trial'
  | 'trial_ending'
  | 'trial_ended'
  | 'admin_code'

export interface ProductEmailCopy {
  key: ProductEmailKey
  name: string
  subject: string
  title: string
  paragraphs: string[]
  ctaLabel: string
  ctaPath: string
  /** When true, CTA is omitted (e.g. admin code uses inline code). */
  hideCta?: boolean
  codePlaceholder?: string
}

const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://www.cashprophet.co.uk').replace(/\/+$/, '')

export const PRODUCT_EMAILS: ProductEmailCopy[] = [
  {
    key: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to Cash Prophet',
    title: 'Welcome to Cash Prophet',
    paragraphs: [
      'You now have a clearer view of where your business really stands, not just what is sitting in the bank.',
      'Start by adding your businesses and saving your account balances. Your Cash Prophet Balance updates as you go.',
    ],
    ctaLabel: 'Open your dashboard',
    ctaPath: '/app',
  },
  {
    key: 'mid_trial',
    name: 'Mid-trial',
    subject: 'Ready to keep Cash Prophet after your trial?',
    title: 'Your trial is underway',
    paragraphs: [
      'You have been using Cash Prophet for about a week. When you are ready, choose a plan and add a card in Settings. Nothing is charged until your free trial ends.',
      'That way editing stays open without a scramble on the last day.',
    ],
    ctaLabel: 'Choose a plan',
    ctaPath: '/app/settings',
  },
  {
    key: 'trial_ending',
    name: 'Trial ending (3 days)',
    subject: 'Your Cash Prophet trial ends in 3 days',
    title: 'Three days left on your trial',
    paragraphs: [
      'Your free trial ends soon. Pick a plan and add a card now so your subscription starts the day after the trial. Your workspace and data stay put either way.',
      'Without a plan, the workspace becomes view-only when the trial ends. You can subscribe later whenever you like.',
    ],
    ctaLabel: 'Choose a plan',
    ctaPath: '/app/settings',
  },
  {
    key: 'trial_ended',
    name: 'Trial ended',
    subject: 'Your Cash Prophet trial has ended',
    title: 'Your trial has ended',
    paragraphs: [
      'You can still view your dashboard. To keep editing balances, commitments and reserves, choose a plan from Settings → Your plan.',
    ],
    ctaLabel: 'Subscribe to keep editing',
    ctaPath: '/app/settings',
  },
  {
    key: 'admin_code',
    name: 'Admin login code',
    subject: 'Your Cash Prophet admin code',
    title: 'Your admin verification code',
    paragraphs: [
      'Use this code to finish signing in to platform admin. It expires in a few minutes.',
      'If you did not request this, you can ignore this email.',
    ],
    ctaLabel: '',
    ctaPath: '/platform-admin',
    hideCta: true,
    codePlaceholder: '123456',
  },
]

export function getProductEmail(key: string): ProductEmailCopy | undefined {
  return PRODUCT_EMAILS.find((e) => e.key === key)
}

export function buildProductEmailHtml(
  copy: ProductEmailCopy,
  options?: { code?: string },
): string {
  const logoUrl = `${SITE_URL}/logo-mark.png`
  const ctaUrl = `${SITE_URL}${copy.ctaPath}`
  const loginUrl = `${SITE_URL}/login`
  const body = copy.paragraphs
    .map((p) => `<p style="margin:0 0 16px;line-height:1.55;color:#243044;font-size:15px">${p}</p>`)
    .join('')
  const codeBlock =
    copy.key === 'admin_code'
      ? `<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:8px 0 20px;color:#0c0022">${
          options?.code ?? copy.codePlaceholder ?? '••••••'
        }</p>`
      : ''
  const cta =
    copy.hideCta || !copy.ctaLabel
      ? ''
      : `<p style="margin:28px 0 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#24da76;color:#0c0022;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">${copy.ctaLabel}</a>
      </p>`

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f6f8">
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:32px 24px">
    <img src="${logoUrl}" alt="Cash Prophet" width="48" height="48" style="display:block;margin:0 0 16px;border:0" />
    <p style="margin:0 0 8px;font-family:Inter,Segoe UI,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;color:#1bb863">CASH PROPHET</p>
    <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#0c0022;font-weight:700">${copy.title}</h1>
    <div style="font-family:Inter,Segoe UI,sans-serif">
      ${body}
      ${codeBlock}
      ${cta}
      <p style="margin:28px 0 0;font-size:13px;color:#3a465c;line-height:1.5">
        Or open <a href="${loginUrl}" style="color:#1bb863">${loginUrl}</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#6b778c">A daily financial position you can trust.</p>
    </div>
  </div>
</body>
</html>`
}
