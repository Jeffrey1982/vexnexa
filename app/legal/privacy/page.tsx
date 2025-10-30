import { Section } from "@/components/layout/Section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How VexNexa collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <Section className="pt-12 md:pt-20 pb-16" background="white">
      <div className="max-w-4xl mx-auto prose prose-charcoal">
        <h1 className="text-display-md text-charcoal mb-6">Privacy Policy</h1>
        <p className="text-sm text-steel-500 mb-8">Last updated: January 2024</p>

        <div className="space-y-8 text-steel-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">1. Introduction</h2>
            <p>
              VexNexa ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your personal information when you visit our
              website or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-charcoal mt-6 mb-3">Information you provide:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, and company name via contact forms</li>
              <li>Project details and requirements you share with us</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>Communications via email, Slack, or other platforms</li>
            </ul>

            <h3 className="text-xl font-semibold text-charcoal mt-6 mb-3">Information collected automatically:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address, browser type, and device information</li>
              <li>Pages visited and time spent on our website</li>
              <li>Referral sources and navigation patterns</li>
              <li>Analytics data via Google Analytics or Plausible (privacy-focused)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Respond to inquiries and provide requested services</li>
              <li>Process payments and manage contracts</li>
              <li>Improve our website and services</li>
              <li>Send project updates and service-related communications</li>
              <li>Analyze website traffic and user behavior (anonymized)</li>
            </ul>
            <p className="mt-4">
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">4. Data Storage & Security</h2>
            <p>
              We store your data securely using industry-standard encryption and security practices. Data is
              stored on servers located in the EU and US (via trusted providers like Vercel, Resend, and Supabase).
            </p>
            <p className="mt-4">
              While we take reasonable precautions, no method of transmission over the internet is 100% secure.
              We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">5. Cookies & Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Remember your preferences</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Improve user experience</li>
            </ul>
            <p className="mt-4">
              You can disable cookies in your browser settings, though some features may not work properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">6. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Vercel</strong> – Website hosting</li>
              <li><strong>Resend</strong> – Email delivery</li>
              <li><strong>Google Analytics / Plausible</strong> – Analytics (anonymized)</li>
              <li><strong>Stripe / PayPal</strong> – Payment processing</li>
            </ul>
            <p className="mt-4">
              These services have their own privacy policies. We recommend reviewing them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">7. Your Rights (GDPR)</h2>
            <p>If you are in the EU, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:info@vexnexa.com" className="text-primary hover:underline">
                info@vexnexa.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">8. Data Retention</h2>
            <p>
              We retain your data for as long as necessary to provide services and comply with legal obligations.
              Contact form submissions are kept for 2 years. Project-related data is kept for the duration of
              the engagement plus 7 years for accounting purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">9. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under 18. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with
              an updated "Last updated" date. Continued use of our services constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">11. Contact Us</h2>
            <p>
              Questions about this Privacy Policy? Contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong>{" "}
              <a href="mailto:info@vexnexa.com" className="text-primary hover:underline">
                info@vexnexa.com
              </a>
              <br />
              <strong>Address:</strong> VexNexa, Netherlands
            </p>
          </section>
        </div>
      </div>
    </Section>
  )
}
