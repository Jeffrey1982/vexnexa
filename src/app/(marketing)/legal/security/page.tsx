export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="text-4xl font-bold font-display mb-8">Security & Privacy</h1>

      <div className="prose prose-lg max-w-none">
        <h2>Data Handling</h2>
        <p>
          TutusPorta scans publicly accessible web pages. We temporarily store scan results
          and metadata to provide our service. We do not collect or store personal data from
          the websites we scan.
        </p>

        <h2>Data Storage</h2>
        <p>
          All scan data is stored securely in encrypted databases. Access is restricted to
          authorized personnel only. We use industry-standard encryption for data at rest and
          in transit.
        </p>

        <h2>Data Retention</h2>
        <p>
          Scan results are retained for the duration of your subscription plus 30 days. You
          can request deletion of your data at any time through your account settings or by
          contacting support.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We use select third-party services for hosting, analytics, and payment processing.
          All third parties are vetted for security and privacy compliance.
        </p>

        <h2>Security Incident Response</h2>
        <p>
          In the event of a security incident, we will notify affected users within 72 hours
          and provide details about the incident and remediation steps.
        </p>

        <h2>Contact</h2>
        <p>
          For security inquiries or to report a vulnerability, please contact us at{" "}
          <a href="mailto:security@vexnexa.com" className="text-primary hover:underline">
            security@vexnexa.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
