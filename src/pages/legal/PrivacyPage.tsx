import { LegalPageLayout } from './LegalPageLayout'
import { COMPANY_INFO } from '../../content/companyInfo'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { PRIVACY_SEO } from '../../content/marketingSeo'
import { openCookiePreferences } from '../../utils/cookieConsent'

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy policy"
      seoTitle={PRIVACY_SEO.title}
      updated="9 August 2026"
      description={PRIVACY_SEO.description}
      path={PRIVACY_SEO.path}
      imageAlt={PRIVACY_SEO.imageAlt}
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
        VAT: {COMPANY_INFO.vatNumber}. ICO registration number: {COMPANY_INFO.icoRegistrationNumber}.
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
          <strong>Usage</strong> — basic technical information needed to run and secure the service,
          and (if you accept advertising cookies) page-view information sent to Meta to measure our
          ads. We do not send your workspace financial figures to Meta.
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
        <li>Understand how the service is found and used</li>
        <li>
          Measure and improve advertising (only if you accept advertising cookies — see Cookies
          below)
        </li>
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
        if you believe your data protection rights have been violated. We are registered with the ICO
        under number {COMPANY_INFO.icoRegistrationNumber}. See{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
          ico.org.uk
        </a>
        .
      </p>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        We use cookies and similar browser storage for different purposes. Some are necessary to run
        Cash Prophet. Others are optional advertising cookies that only run if you choose to accept
        them.
      </p>
      <h3>Necessary</h3>
      <p>
        These keep the service working: signing you in, remembering preferences (including your cookie
        choice), first-party marketing tags that tell us which campaign link you used, and completing
        payment where Stripe handles checkout. The site cannot function properly without these.
      </p>
      <h3>Advertising (optional)</h3>
      <p>
        If you accept advertising cookies, we load the Meta Pixel (Facebook / Instagram), operated by
        Meta Platforms Ireland Ltd. / Meta Platforms, Inc. This helps us measure the effectiveness of
        our ads, understand which pages people visit after clicking an ad, and build audiences for
        future advertising (for example people who visited the site, or who should be excluded because
        they already signed up or subscribed — once those events are configured).
      </p>
      <p>
        Meta may set cookies such as <code>_fbp</code> and receive technical information about your
        browser and pages viewed on cashprophet.co.uk. We do <strong>not</strong> send your bank
        balances, Cash Prophet Balance, commitments, reserve plans, passwords, or other workspace
        financial figures to Meta.
      </p>
      <p>
        You can accept or reject advertising cookies when you first visit, and you can change your mind
        at any time via{' '}
        <button type="button" className="legal-inline-btn" onClick={() => openCookiePreferences()}>
          Cookie preferences
        </button>
        {' '}
        or the link in the site footer. If you reject advertising cookies, Cash Prophet still works
        normally; the Meta Pixel will not load.
      </p>
      <p>
        For Meta&apos;s own information about how they process data, see Meta&apos;s privacy policy on
        their website. We do not sell your personal information.
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
