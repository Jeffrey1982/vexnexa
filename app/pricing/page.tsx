"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/Section"
import { PricingTable } from "@/components/pricing/PricingTable"
import { ComparisonTable } from "@/components/pricing/ComparisonTable"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { pricingPlans, comparisonRows } from "@/lib/data/fixture-data"

const faqs = [
  {
    q: "What's included in each plan?",
    a: "Each plan includes strategy, design, development, and launch support. The main differences are scope (project size), timeline, and level of ongoing support. See the comparison table below for details.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Many clients start with Starter for a quick win, then move to Growth for ongoing optimization. We'll help you transition smoothly.",
  },
  {
    q: "What if my project is too big for Starter but too small for Growth?",
    a: "We can create a custom scope that fits. Starter and Growth are just our most common packages—we're flexible.",
  },
  {
    q: "Do you work hourly or fixed-price?",
    a: "Starter projects are fixed-price. Growth and Scale are monthly retainers with agreed-upon hours and priorities. No surprise hourly bills.",
  },
  {
    q: "What tech stack do you use?",
    a: "We're stack-agnostic but prefer modern, maintainable tools: Next.js, React, TailwindCSS, TypeScript, Vercel/Netlify. We'll recommend what fits your needs and team.",
  },
  {
    q: "Who owns the code and design?",
    a: "You do. Full IP transfer upon final payment. We may showcase work in our portfolio (with your approval), but all assets are yours.",
  },
  {
    q: "Do you guarantee WCAG compliance?",
    a: "We implement to WCAG 2.1 AA standards and provide audit reports. However, we're engineers, not lawyers—formal legal compliance advice is outside our scope.",
  },
  {
    q: "What if I need GDPR or other compliance help?",
    a: "We can implement technical measures (cookie consent, data handling) but don't provide legal compliance advice. We recommend consulting a lawyer for formal compliance.",
  },
  {
    q: "What happens if the project takes longer than expected?",
    a: "If delays are on our end, we absorb the cost. If scope changes or client delays extend the timeline, we'll re-scope and agree on terms before continuing.",
  },
  {
    q: "Can I pause or cancel my retainer?",
    a: "Growth plans require a 3-month minimum; Scale requires quarterly. After that, you can pause or cancel with 30 days notice. No long-term lock-ins.",
  },
]

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-12 md:pt-20 pb-16 text-center" background="gradient">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display-lg md:text-display-xl text-charcoal mb-6">
            Transparent <span className="text-primary">pricing</span>
          </h1>
          <p className="text-xl text-steel-600 max-w-3xl mx-auto mb-8">
            No hidden fees. No hourly billing surprises. Choose a plan that fits your needs and budget.
          </p>
        </motion.div>
      </Section>

      {/* Pricing Plans */}
      <Section background="white">
        <PricingTable plans={pricingPlans} />
      </Section>

      {/* Comparison Table */}
      <Section background="default">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              Full feature comparison
            </h2>
            <p className="text-lg text-steel-600">
              See exactly what's included in each plan.
            </p>
          </div>

          <ComparisonTable rows={comparisonRows} />
        </div>
      </Section>

      {/* FAQ */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-steel-600">
              Everything you need to know about pricing, process, and policies.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-steel-200 rounded-lg px-6 bg-white">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold text-charcoal">{faq.q}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-steel-600 leading-relaxed">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Compliance Note */}
      <Section background="default">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border-l-4 border-primary p-8 rounded-lg shadow-soft-sm"
          >
            <h3 className="text-xl font-semibold text-charcoal mb-3">
              A note on compliance
            </h3>
            <p className="text-steel-600 leading-relaxed mb-4">
              We implement websites and systems to meet technical standards like WCAG 2.1 AA,
              GDPR data handling best practices, and security protocols. However, we are not lawyers
              and do not provide legal compliance advice.
            </p>
            <p className="text-steel-600 leading-relaxed">
              For formal legal compliance certification (especially for regulated industries),
              we recommend consulting with a qualified attorney alongside our technical implementation.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* CTA */}
      <Section background="gradient" className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-display-sm text-charcoal mb-6">
            Still have questions?
          </h2>
          <p className="text-xl text-steel-600 mb-8 max-w-2xl mx-auto">
            Schedule a free 15-minute call. No pitch, just honest answers about what will work for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Schedule a call</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/services">View service packs</Link>
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
