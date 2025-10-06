export default function SLAPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="text-4xl font-bold font-display mb-8">SLA & Support</h1>

      <div className="prose prose-lg max-w-none">
        <h2>Service Level Agreement</h2>
        <p>
          TutusPorta commits to providing reliable service with the following availability
          targets:
        </p>
        <ul>
          <li>
            <strong>Uptime:</strong> 99.9% uptime on all paid plans (excludes scheduled
            maintenance)
          </li>
          <li>
            <strong>Scheduled Maintenance:</strong> Announced at least 48 hours in advance
          </li>
          <li>
            <strong>Scan Processing:</strong> Scans typically complete within 5-15 minutes for
            standard pages
          </li>
        </ul>

        <h2>Support Levels</h2>

        <h3>Starter Plan</h3>
        <ul>
          <li>Email support</li>
          <li>Response time: Within 2 business days</li>
          <li>Access to documentation and guides</li>
        </ul>

        <h3>Pro Plan</h3>
        <ul>
          <li>Priority email support</li>
          <li>Response time: Within 1 business day</li>
          <li>Access to advanced documentation</li>
          <li>Quarterly check-in calls (optional)</li>
        </ul>

        <h3>Business Plan</h3>
        <ul>
          <li>Priority support via email and chat</li>
          <li>Response time: Within 4 hours during business hours</li>
          <li>Dedicated account manager</li>
          <li>Monthly check-in calls</li>
          <li>Priority feature requests</li>
        </ul>

        <h3>Enterprise Plan</h3>
        <ul>
          <li>24/7 support via phone, email, and chat</li>
          <li>Response time: Within 1 hour for critical issues</li>
          <li>Dedicated account team</li>
          <li>Custom SLA available</li>
          <li>On-call support for emergencies</li>
        </ul>

        <h2>Incident Response</h2>
        <p>
          We monitor our systems 24/7 and respond to incidents according to severity:
        </p>
        <ul>
          <li><strong>Critical:</strong> Service down - Immediate response</li>
          <li><strong>High:</strong> Major functionality impaired - Response within 2 hours</li>
          <li><strong>Medium:</strong> Minor functionality impaired - Response within 1 business day</li>
          <li><strong>Low:</strong> Cosmetic or minor issues - Response within 3 business days</li>
        </ul>

        <h2>Contact Support</h2>
        <p>
          Reach our support team at{" "}
          <a href="mailto:support@vexnexa.com" className="text-primary hover:underline">
            support@vexnexa.com
          </a>{" "}
          or through the contact form in your dashboard.
        </p>
      </div>
    </div>
  );
}
