import { Section } from "@/components/layout/Section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'VexNexa Terms of Service and conditions for working with us.',
}

export default function TermsPage() {
  return (
    <Section className="pt-12 md:pt-20 pb-16" background="white">
      <div className="max-w-4xl mx-auto prose prose-charcoal">
        <h1 className="text-display-md text-charcoal mb-6">Terms of Service</h1>
        <p className="text-sm text-steel-500 mb-8">Last updated: January 2024</p>

        <div className="space-y-8 text-steel-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using VexNexa's services, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms,
              you are prohibited from using our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">2. Services</h2>
            <p>
              VexNexa provides digital development services including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Website design and development</li>
              <li>Workflow automation</li>
              <li>AI integration and implementation</li>
              <li>Accessibility auditing and remediation</li>
            </ul>
            <p className="mt-4">
              All services are subject to scope agreements defined before project commencement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">3. Project Scope & Changes</h2>
            <p>
              Each project begins with a clearly defined scope. Changes to scope require mutual agreement
              and may affect timeline and pricing. We reserve the right to pause work if scope changes
              are not agreed upon in writing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">4. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fixed-price projects: 50% deposit upfront, 50% upon completion</li>
              <li>Monthly retainers: Billed at the start of each month</li>
              <li>Quarterly retainers: Billed quarterly in advance</li>
              <li>Invoices are due within 14 days of issue</li>
              <li>Late payments may result in work suspension</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              Upon final payment, all custom code, designs, and deliverables are transferred to the client.
              VexNexa retains the right to showcase work in portfolios and case studies (with client approval).
              Pre-existing tools, frameworks, and libraries remain under their respective licenses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">6. Client Responsibilities</h2>
            <p>Clients are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Providing timely feedback and approvals</li>
              <li>Supplying necessary access to tools, accounts, and systems</li>
              <li>Providing content, brand assets, and other materials as needed</li>
              <li>Maintaining hosting, domains, and third-party services post-delivery</li>
            </ul>
            <p className="mt-4">
              Delays caused by client unavailability or slow feedback may extend project timelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">7. Warranties & Limitations</h2>
            <p>
              We guarantee our work meets agreed specifications. However, we do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Specific search engine rankings or traffic metrics</li>
              <li>Legal compliance beyond technical implementation (consult a lawyer for formal compliance)</li>
              <li>Third-party service uptime or functionality</li>
              <li>Results from AI models or automated systems (outputs may vary)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">8. Support & Maintenance</h2>
            <p>
              30 days of post-launch support is included in all projects. After this period, support
              is available via retainer or on an hourly basis. Emergency support may incur additional fees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">9. Termination</h2>
            <p>
              Either party may terminate with 30 days written notice. Upon termination:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Client pays for all completed work to date</li>
              <li>VexNexa delivers all work completed up to termination date</li>
              <li>Deposits are non-refundable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">10. Liability</h2>
            <p>
              VexNexa's liability is limited to the amount paid for services. We are not liable for
              indirect, incidental, or consequential damages arising from use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">11. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Netherlands. Any disputes will be resolved
              in the courts of the Netherlands.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mt-8 mb-4">12. Contact</h2>
            <p>
              Questions about these terms? Contact us at{" "}
              <a href="mailto:hello@vexnexa.com" className="text-primary hover:underline">
                hello@vexnexa.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </Section>
  )
}
