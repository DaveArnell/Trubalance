import { LegalPageLayout } from './LegalPageLayout'
import { COMPANY_INFO } from '../../content/companyInfo'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { TERMS_SEO } from '../../content/marketingSeo'

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of service"
      seoTitle={TERMS_SEO.title}
      updated="16 July 2026"
      description={TERMS_SEO.description}
      path={TERMS_SEO.path}
      imageAlt={TERMS_SEO.imageAlt}
    >
      <p>
        These terms govern your use of {COMPANY_INFO.productName} (&quot;the service&quot;), operated
        by {COMPANY_INFO.legalName}. By creating an account or using the service, you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        {COMPANY_INFO.productName} is a planning and visibility tool for business cash. It helps you
        model balances, commitments, and reserves. It is not accounting software, tax advice, or a
        substitute for professional judgement. You are responsible for how you use the figures it shows.
      </p>

      <h2>{REGULATORY_POSITION.termsHeading}</h2>
      {REGULATORY_POSITION.termsBody.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}

      <h2>Accounts and trials</h2>
      <ul>
        <li>You must provide accurate registration details and keep your login secure.</li>
        <li>Free trials and subscriptions are described on our pricing page and may change with notice.</li>
        <li>We may suspend or close accounts that abuse the service or breach these terms.</li>
      </ul>

      <h2>Your data</h2>
      <ul>
        <li>You own the content you enter. You grant us permission to host and process it to run the service.</li>
        <li>
          Download backups regularly. While we use reliable hosting, no online service can guarantee
          zero risk of loss — see our Privacy policy for where data is stored.
        </li>
        <li>Do not upload unlawful content or material you do not have rights to use.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to access other users&apos; workspaces without permission</li>
        <li>Probe, scan, or test vulnerabilities except with our written consent</li>
        <li>Use the service in a way that harms infrastructure or other users</li>
        <li>Reverse engineer or resell the service except where law allows</li>
      </ul>

      <h2>Availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted access. Maintenance, updates, or
        third-party outages may cause downtime. We will try to give reasonable notice for planned work.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {COMPANY_INFO.productName} is provided &quot;as is&quot;.
        We are not liable for indirect or consequential losses, or for decisions you make based on
        figures in the app. Our total liability for any claim relating to the service is limited to the
        fees you paid us in the twelve months before the claim (or zero during a free trial).
      </p>

      <h2>Changes and termination</h2>
      <p>
        We may update these terms or the service. Material changes will be reflected on this page. You
        may stop using the service at any time. We may terminate access if you breach these terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of {COMPANY_INFO.jurisdiction}. Courts in{' '}
        {COMPANY_INFO.jurisdiction} have exclusive jurisdiction, without prejudice to mandatory consumer
        rights in your country of residence.
      </p>

      <h2>Contact and complaints</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${COMPANY_INFO.contactEmail}`}>{COMPANY_INFO.contactEmail}</a>.
      </p>
      <p>
        If you have a complaint about our service, contact us at the same address. We will acknowledge
        your complaint within 2 business days and aim to resolve it within 14 business days.
      </p>
    </LegalPageLayout>
  )
}
