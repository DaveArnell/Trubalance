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
      updated="30 August 2026"
      description={PRIVACY_SEO.description}
      path={PRIVACY_SEO.path}
      imageAlt={PRIVACY_SEO.imageAlt}
    >
      <h2>About this policy</h2>
      <p>
        {COMPANY_INFO.productName} is a financial organiser for owner-managed businesses. It helps you
        keep track of your day-to-day financial position, regular commitments, expected receipts,
        planned reserves and related financial information.
      </p>
      <p>
        This policy explains what personal information we collect, how we use it, who we share it with,
        and your choices. It applies to the website and the signed-in product at{' '}
        {COMPANY_INFO.website.replace(/^https:\/\//, '')}.
      </p>

      <h2>Who we are</h2>
      <p>
        The data controller is {COMPANY_INFO.legalName}. Registered office:{' '}
        {COMPANY_INFO.registeredAddressLines.join(', ')}. Company number: {COMPANY_INFO.companyNumber}.
        VAT: {COMPANY_INFO.vatNumber}. ICO registration number: {COMPANY_INFO.icoRegistrationNumber}.
      </p>
      <p>
        Contact:{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>

      <h2>What information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>
          Email address and authentication credentials when you create an account with email and
          password.
        </li>
        <li>
          If you sign in with Google, we receive the account identifiers Google provides for
          authentication (typically your Google email address and basic profile name). We do not
          receive access to your Gmail, Google Drive or other Google services.
        </li>
        <li>Profile details such as display name where you provide them.</li>
      </ul>

      <h3>Workspace and financial organiser data</h3>
      <p>
        When you use the product, we store the business information you enter or confirm, which may
        include:
      </p>
      <ul>
        <li>Groups, businesses and venues or sites</li>
        <li>Accounts and balances you record</li>
        <li>Cash Prophet Balance history and related snapshots</li>
        <li>Regular costs, accruing bills and other commitments</li>
        <li>Expected receipts</li>
        <li>Reserve Planner plans and bills</li>
        <li>Financial calendar checklist items and day notes</li>
        <li>Settings, preferences and workspace restore points</li>
      </ul>
      <p>{REGULATORY_POSITION.privacyDataNote}</p>

      <h3>Bank statement import (optional)</h3>
      <p>
        If you use optional bank history import during setup, your browser reads the CSV or PDF on
        your device. We do not upload the raw file to our file storage. A compact summary of
        money-out transactions (dates, shortened descriptions and amounts) is sent to our analysis
        service so we can suggest recurring costs and reserve items for you to review. Structured
        suggestions may be cached in your browser so you can reopen them without re-uploading. If
        you accept suggestions, they become ordinary workspace data.
      </p>

      <h3>Payments and billing</h3>
      <p>
        If you subscribe, Stripe processes checkout and billing. We store subscription status,
        related identifiers and payment records needed to operate your plan. We do not receive or
        store full card numbers.
      </p>

      <h3>Support and enquiries</h3>
      <p>
        Messages you send through our contact or in-app support channels, and related contact
        details.
      </p>

      <h3>Technical and marketing measurement</h3>
      <ul>
        <li>
          Necessary technical storage to keep you signed in, remember preferences (including cookie
          choices) and operate the product.
        </li>
        <li>
          If you accept optional analytics and advertising cookies: page-view and advertising
          measurement via Google Analytics and Meta, and first-party campaign tags (such as UTM
          parameters) so we can see which marketing link led to a visit or signup. We do not send
          workspace balances, Cash Prophet Balance, commitments, reserve plans or imported statement
          transactions to Google or Meta.
        </li>
      </ul>
      <p>We do not sell your workspace data. We do not use your financial figures to build advertising profiles.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>Provide, maintain and secure {COMPANY_INFO.productName}</li>
        <li>Authenticate you and sync your workspace across sessions and devices</li>
        <li>Process subscriptions and invoices through Stripe</li>
        <li>Respond to support and enquiry messages</li>
        <li>Send transactional service emails (for example about your trial or account)</li>
        <li>
          Measure marketing and website use only where you have accepted optional analytics and
          advertising cookies
        </li>
        <li>Meet legal and security obligations where they apply</li>
      </ul>

      <h2>Legal bases for processing</h2>
      <p>Under UK GDPR we rely on the following bases where they apply:</p>
      <div className="legal-table-wrap">
        <table className="legal-simple-table">
          <thead>
            <tr>
              <th scope="col">Purpose</th>
              <th scope="col">Examples of data</th>
              <th scope="col">Legal basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Purpose">
                Create and manage your account; provide the product; sync workspace data
              </td>
              <td data-label="Examples of data">Account details; workspace financial organiser data</td>
              <td data-label="Legal basis">Contract (to provide the service you request)</td>
            </tr>
            <tr>
              <td data-label="Purpose">Subscriptions and billing</td>
              <td data-label="Examples of data">
                Plan status; Stripe customer and payment records we store
              </td>
              <td data-label="Legal basis">
                Contract; legal obligation where tax or accounting rules require records
              </td>
            </tr>
            <tr>
              <td data-label="Purpose">Optional statement analysis suggestions</td>
              <td data-label="Examples of data">Compact transaction summaries sent for analysis</td>
              <td data-label="Legal basis">Contract (feature you choose to use)</td>
            </tr>
            <tr>
              <td data-label="Purpose">
                Support for an existing Cash Prophet customer or account
              </td>
              <td data-label="Examples of data">Messages and contact details you send</td>
              <td data-label="Legal basis">
                Contract (responding as part of providing the service)
              </td>
            </tr>
            <tr>
              <td data-label="Purpose">
                General enquiries from prospective customers or other contacts
              </td>
              <td data-label="Examples of data">Messages and contact details you send</td>
              <td data-label="Legal basis">
                Legitimate interests (responding to the enquiry)
              </td>
            </tr>
            <tr>
              <td data-label="Purpose">Security, abuse prevention and reliability</td>
              <td data-label="Examples of data">
                Technical logs and account security data as needed to run the service
              </td>
              <td data-label="Legal basis">
                Legitimate interests (keeping the service secure and usable)
              </td>
            </tr>
            <tr>
              <td data-label="Purpose">Optional analytics and advertising measurement</td>
              <td data-label="Examples of data">Page views; ad cookies; first-party campaign tags</td>
              <td data-label="Legal basis">Consent</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Where we rely on legitimate interests, we balance those interests against your rights. You may
        object where the law allows. Where we rely on consent, you can withdraw it at any time via{' '}
        <button type="button" className="legal-inline-btn" onClick={() => openCookiePreferences()}>
          Cookie preferences
        </button>
        .
      </p>

      <h2 id="bank-import">Bank statement and AI-assisted setup</h2>
      <p>
        Statement import is optional. Parsing happens in your browser. The raw CSV or PDF is not
        stored in our file storage. For analysis we send a reduced representation of outgoing
        transactions to OpenAI&apos;s API (not the ChatGPT consumer website). OpenAI processes that
        information as our processor for generating suggestions. We do not use OpenAI elsewhere in
        the product today.
      </p>
      <p>
        After analysis, the in-browser copy of the raw file content is cleared. Suggestions may remain
        in your browser storage until cleared. Accepted items are stored as normal workspace data.
      </p>

      <h2>Who we share data with</h2>
      <p>We use service providers to operate Cash Prophet. They only receive what is needed for their role:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: authentication, database and related backend hosting for
          accounts and workspace data.
        </li>
        <li>
          <strong>OpenAI</strong>: optional statement analysis only (compact transaction summaries).
        </li>
        <li>
          <strong>Stripe</strong>: subscription checkout, billing portal, tax calculation and payment
          processing. Card details are handled by Stripe, not by us.
        </li>
        <li>
          <strong>Resend</strong>: sending transactional and enquiry-related emails.
        </li>
        <li>
          <strong>Google</strong>: Google sign-in (if you choose it) and, with consent, Google
          Analytics.
        </li>
        <li>
          <strong>Meta</strong>: with consent, Meta Pixel and related conversion measurement for
          advertising.
        </li>
        <li>
          <strong>Hosting and infrastructure</strong>: our website is hosted on cloud infrastructure
          (currently Vercel for the public web app) so the service can be delivered.
        </li>
      </ul>
      <p>
        We do not share your full workspace financial dataset with Meta, Google Analytics or
        advertising platforms.
      </p>

      <h2>International data transfers</h2>
      <p>
        Some of the service providers listed above may process personal information outside the
        United Kingdom. Where UK data protection law requires it, we use appropriate safeguards for
        those transfers. The precise safeguard can depend on the provider and how the service is
        configured. If you need more detail for a specific provider, contact us and we will explain
        what we can from our contracts and their documentation.
      </p>

      <h2>Where data is stored</h2>
      <ul>
        <li>
          <strong>Signed-in accounts</strong>: workspace and account data are stored in our
          database (hosted via Supabase) and may also be cached in your browser while you use the
          app.
        </li>
        <li>
          <strong>Without an account</strong>: data stays in browser storage on that device unless
          you later sign up and sync, or send us information directly.
        </li>
        <li>
          <strong>Exports</strong>: JSON downloads from Settings are saved on your device. We do not
          keep a separate copy of that download file.
        </li>
      </ul>

      <h2>Retention</h2>
      <ul>
        <li>
          <strong>Active accounts</strong>: we keep account and workspace data while your account
          remains open so we can provide the service.
        </li>
        <li>
          <strong>Account deletion</strong>: you can delete your account from Settings. That removes
          your profile, authentication account and owned workspace data from our application
          database. Some records that are not tied to your user account (for example a contact-form
          enquiry under your email, or anonymised marketing visit rows) may remain. Billing records
          may need to be kept for tax or accounting purposes. Stripe and other processors may retain
          information under their own policies.
        </li>
        <li>
          <strong>Raw statement files</strong>: not retained on our servers; cleared from the
          browser session after analysis.
        </li>
        <li>
          <strong>Statement suggestions</strong>: may remain in browser storage until you clear site
          data or they expire from local cache; accepted items remain as workspace data.
        </li>
        <li>
          <strong>Optional advertising cookies</strong>: follow the provider&apos;s cookie lifetime
          unless you withdraw consent earlier. First-party campaign tags we store after consent are
          kept for up to 90 days or until cleared.
        </li>
        <li>
          <strong>Support and enquiries</strong>: kept while we need them to handle your request,
          follow up if needed, and keep a record of that correspondence. We do not currently apply a
          fixed automatic deletion timetable to these messages.
        </li>
      </ul>

      <h2 id="cookies">Cookies and similar technologies</h2>
      <p>
        We use cookies and similar browser storage. Necessary storage runs to provide the service.
        Optional analytics and advertising technologies run only if you Accept in Cookie preferences.
      </p>
      <h3>Necessary</h3>
      <ul>
        <li>Sign-in and session storage so you stay authenticated</li>
        <li>Remembering your cookie preference</li>
        <li>Local workspace cache and product preferences needed for the app to work</li>
        <li>Stripe checkout and payment flow storage handled during billing</li>
      </ul>
      <h3>Optional (consent)</h3>
      <ul>
        <li>Google Analytics for site usage measurement</li>
        <li>Meta Pixel and related advertising measurement cookies</li>
        <li>
          First-party campaign attribution (UTM and similar tags, anonymous visitor identifiers used
          for marketing funnel reporting)
        </li>
      </ul>
      <p>
        Reject keeps Cash Prophet working. Accept enables only the optional categories above. You can
        change your mind later via{' '}
        <button type="button" className="legal-inline-btn" onClick={() => openCookiePreferences()}>
          Cookie preferences
        </button>{' '}
        in the footer.
      </p>
      <p>
        We do <strong>not</strong> send bank balances, Cash Prophet Balance, commitments, reserve
        plans, passwords or imported statement transactions to Google or Meta.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you may have rights to access, rectify, erase, restrict or object to certain
        processing, to data portability, to withdraw consent where processing is based on consent,
        and to complain to the ICO. These rights are not absolute in every case.
      </p>
      <p>
        You can export a JSON copy of your workspace from Settings. That export may help with your
        own records, but a formal portability or access request can be made by emailing{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>
      <p>
        You can delete your account from Settings. For other requests, contact us at the same email.
      </p>
      <p>
        You may complain to the Information Commissioner&apos;s Office (ICO). We are registered under
        number {COMPANY_INFO.icoRegistrationNumber}. See{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
          ico.org.uk
        </a>
        .
      </p>

      <h2>Security</h2>
      <p>
        We use technical and organisational measures designed to protect account and workspace data.
        No online service can guarantee absolute security.
      </p>

      <h2>Children</h2>
      <p>
        Cash Prophet is aimed at businesses. It is not intended for children.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. The &quot;Last updated&quot; date at the top
        will change when we do. Where changes are material, we will take reasonable steps to make
        them visible.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions:{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>
    </LegalPageLayout>
  )
}
