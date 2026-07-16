import { LegalPageLayout } from './LegalPageLayout'
import { COMPANY_INFO } from '../../content/companyInfo'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { PRIVACY_SEO } from '../../content/marketingSeo'

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy policy"
      updated="16 July 2026"
      description={PRIVACY_SEO.description}
      path={PRIVACY_SEO.path}
    >
      <p>
        {COMPANY_INFO.productName} (&quot;the service&quot;) is owned and operated by{' '}
        {COMPANY_INFO.legalName} (&quot;we&quot;, &quot;us&quot;). We help you understand what cash is
        genuinely available in your business. This policy explains what we collect, where it is stored,
        and your choices.
      </p>

      <h2>Who we are</h2>
      <p>
        Data controller: {COMPANY_INFO.legalName}. Registered office:{' '}
        {COMPANY_INFO.registeredAddressLines.join(', ')}. Company number: {COMPANY_INFO.companyNumber}.
        VAT: {COMPANY_INFO.vatNumber}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — email address and authentication data when you sign up or
          log in.
        </li>
        <li>
          <strong>Workspace data</strong> — the financial and operational information you enter: groups,
          businesses, accounts, balances, commitments, expected receipts, reserve plans, and snapshots.
        </li>
        <li>
          <strong>Usage</strong> — basic technical logs needed to run and secure the service (for
          example errors and sign-in events).
        </li>
      </ul>
      <p>{REGULATORY_POSITION.privacyDataNote}</p>
      <p>
        We do not sell your workspace data. We do not use your figures for advertising profiles.
      </p>

      <h2>Where your data is stored</h2>
      <ul>
        <li>
          <strong>With an account</strong> — your workspace is stored in our database (hosted via
          Supabase) and tied to your user account. A copy may also sit in your browser while you use
          the app.
        </li>
        <li>
          <strong>Without an account</strong> — data stays in your browser&apos;s local storage on
          that device only. We do not receive it unless you sign up and sync, or contact us directly.
        </li>
        <li>
          <strong>Downloads</strong> — when you export JSON from Settings, that file is saved wherever
          you choose on your device; we do not keep a copy of exports.
        </li>
      </ul>

      <h2>How we use your data</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide, maintain, and improve {COMPANY_INFO.productName}</li>
        <li>Authenticate you and sync your workspace across sessions</li>
        <li>Respond to support requests</li>
        <li>Meet legal and security obligations</li>
      </ul>

      <h2>Retention and deletion</h2>
      <p>
        We keep workspace data while your account is active. If you close your account or ask us to
        delete your data, we will remove or anonymise it within a reasonable period, subject to any
        legal retention requirements.
      </p>
      <p>
        Clearing your browser data removes the local copy only. Account data remains until you delete
        your account or request erasure.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, export, or delete personal
        data we hold about you. You can download your workspace from Settings at any time. For other
        requests, contact us at{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>
      <p>
        You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO)
        if you believe your data protection rights have been violated.
      </p>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        True Balance does not use advertising cookies or third-party analytics trackers (such as Google
        Analytics). We use only what is needed to run the service:
      </p>
      <ul>
        <li>
          <strong>Authentication</strong> — session tokens from our auth provider so you stay signed in
          securely.
        </li>
        <li>
          <strong>Local storage</strong> — to remember your workspace, layout preferences, and similar
          settings on your device.
        </li>
        <li>
          <strong>Payment</strong> — if you subscribe, Stripe may set cookies when you complete checkout
          on their secure pages.
        </li>
      </ul>
      <p>
        These are strictly necessary for the app to function. We do not sell data from cookies or use
        them for advertising profiles.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. The &quot;Last updated&quot; date at the top will
        change when we do. Continued use after changes means you accept the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>
    </LegalPageLayout>
  )
}
