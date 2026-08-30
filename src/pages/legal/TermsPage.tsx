import { LegalPageLayout } from './LegalPageLayout'
import { COMPANY_INFO } from '../../content/companyInfo'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { TERMS_SEO } from '../../content/marketingSeo'
import { TRIAL_DAYS } from '../../config/subscriptionTiers'

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of service"
      seoTitle={TERMS_SEO.title}
      updated="30 August 2026"
      description={TERMS_SEO.description}
      path={TERMS_SEO.path}
      imageAlt={TERMS_SEO.imageAlt}
    >
      <p>
        These terms govern your use of {COMPANY_INFO.productName} (&quot;the service&quot;), operated
        by {COMPANY_INFO.legalName} (&quot;we&quot;, &quot;us&quot;). By creating an account or using
        the service, you agree to them.
      </p>
      <p>
        {COMPANY_INFO.productName} is provided primarily for business use.
      </p>

      <h2>The service</h2>
      <p>
        {COMPANY_INFO.productName} is a financial organiser for owner-managed businesses. It helps
        you organise balances, regular commitments, expected receipts, planned reserves and other
        day-to-day financial information.
      </p>
      <p>
        It is not accounting software, tax advice, regulated financial advice or a substitute for
        professional judgement.
      </p>

      <h2>{REGULATORY_POSITION.termsHeading}</h2>
      {REGULATORY_POSITION.termsBody.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}

      <h2>Early Access</h2>
      <p>
        We currently offer Early Access with personal setup strongly encouraged. The core service is
        live and used with real customer data. Features may continue to evolve during Early Access,
        and we apply the data protection and security practices described in our Privacy policy.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must provide accurate registration details and keep your login secure.</li>
        <li>
          You may sign up with email and password or with Google sign-in where that option is
          available.
        </li>
        <li>
          By creating an account you agree to these terms and acknowledge our Privacy policy.
        </li>
        <li>
          We may suspend or terminate accounts for breach of these terms, abuse, security risk or
          non-payment where relevant.
        </li>
      </ul>

      <h2>Free period and paid subscriptions</h2>
      <p>
        New customers currently receive a free period of {TRIAL_DAYS} days as described on our Pricing
        page. No card is required to begin the free period. You will not be charged during the free
        period.
      </p>
      <p>
        After the free period you may choose a paid plan shown on the Pricing page. Current plan
        options, limits and prices are set out there and may change over time. The first charge for a
        paid plan occurs after the free period ends, when you have chosen a plan and completed
        checkout (or as otherwise stated at checkout).
      </p>
      <h3>Monthly billing</h3>
      <p>
        Monthly subscriptions renew automatically each month until cancelled. You can cancel before
        the next renewal through the billing portal in Settings. After cancellation, access normally
        continues until the end of the period already paid for.
      </p>
      <h3>Annual billing</h3>
      <p>
        Annual subscriptions are paid upfront for the year and renew automatically each year until
        cancelled, unless stated otherwise at checkout. Cancelling stops future renewal. It does not
        automatically mean a refund of the unused portion of an annual fee.
      </p>
      <h3>Managing billing</h3>
      <p>
        Payment details are collected and processed by Stripe. You can manage payment methods,
        invoices and cancellation through the Stripe customer portal linked from Settings (Your
        plan), where billing is enabled.
      </p>
      <h3>Price changes</h3>
      <p>
        We may change plans or prices. For changes that affect an existing paid subscription, we will
        give reasonable notice before the change applies so you can cancel if you do not wish to
        continue.
      </p>
      <h3>Refunds</h3>
      <p>
        Refund requests are considered case by case. Contact{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a> if you need to
        discuss a charge.
      </p>

      <h2>Your information and responsibility</h2>
      <ul>
        <li>
          You own the content you enter. You grant us permission to host and process it to run the
          service, as described in our Privacy policy.
        </li>
        <li>
          Figures, trends and reserve suggestions depend on the information you enter or confirm. You
          remain responsible for verifying business information and for decisions you make.
        </li>
        <li>
          {COMPANY_INFO.productName} does not guarantee future cash availability. Forecasts, trends
          and planned reserve suggestions are planning information, not guarantees.
        </li>
        <li>
          You can export your workspace as JSON from Settings. We take reasonable measures to maintain
          the service and protect stored data, but no online service can guarantee against all loss or
          interruption.
        </li>
        <li>Do not upload unlawful content or material you do not have rights to use.</li>
      </ul>

      <h2>Closing your account</h2>
      <p>
        You may cancel a paid subscription through the billing portal as described above. You may
        delete your account from Settings, which removes your account and owned workspace data from
        our application database, subject to records we may need to keep for billing, tax or legal
        reasons and subject to our Privacy policy.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Cash Prophet, including its software, design, branding and other service content, is owned by
        or licensed to {COMPANY_INFO.legalName}. Subject to these terms, we give you a limited,
        non-exclusive, non-transferable right to use the service for your business while your account
        is active.
      </p>
      <p>
        You retain ownership of the business information and other content you enter into Cash
        Prophet.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Access other users&apos; workspaces without permission</li>
        <li>Probe, scan or attack the service or related infrastructure without our written consent</li>
        <li>Use the service in a way that harms infrastructure or other users</li>
        <li>Upload or run unlawful content or activity</li>
        <li>Resell the service without permission</li>
        <li>Reverse engineer the service except where law allows</li>
      </ul>

      <h2>Availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted access. Maintenance,
        updates or third-party outages may cause downtime. We will try to give reasonable notice for
        planned work.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {COMPANY_INFO.productName} is provided &quot;as
        is&quot;. We are not liable for indirect or consequential losses, or for decisions you make
        based on figures in the app. Our total liability for any claim relating to the service is
        limited to the fees you paid us in the twelve months before the claim (or zero during a free
        trial), except where a different limit is required by law.
      </p>
      <p>
        Nothing in these terms excludes or limits liability that cannot lawfully be excluded or
        limited.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms or the service. Material changes will be reflected on this page. You
        may stop using the service at any time.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of {COMPANY_INFO.jurisdiction}. Courts in{' '}
        {COMPANY_INFO.jurisdiction} have exclusive jurisdiction, without prejudice to mandatory rights
        that cannot be waived.
      </p>

      <h2>Contact and complaints</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>
      <p>
        If you have a complaint about our service, contact us at the same address. We aim to
        acknowledge complaints promptly and resolve them within a reasonable time.
      </p>
    </LegalPageLayout>
  )
}
