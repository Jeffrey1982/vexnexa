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
      <Section className="pt-16 md:pt-24 pb-20 text-center relative overflow-hidden" background="gradient">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-block mb-4">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              Simple, transparent pricing
            </span>
          </div>
          <h1 className="text-display-lg md:text-display-xl text-charcoal mb-6 tracking-tight">
            Transparent <span className="text-primary bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent">pricing</span>
          </h1>
          <p className="text-xl md:text-2xl text-steel-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            No hidden fees. No hourly billing surprises. Choose a plan that fits your needs and budget.
          </p>
        </motion.div>
      </Section>

      {/* Pricing Plans */}
      <Section background="white" className="py-20 md:py-28">
        <PricingTable plans={pricingPlans} />
      </Section>

      {/* Comparison Table */}
      <Section background="default" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="bg-white shadow-soft-sm text-charcoal px-4 py-2 rounded-full text-sm font-semibold border border-steel-200">
                Detailed breakdown
              </span>
            </div>
            <h2 className="text-display-sm text-charcoal mb-4 tracking-tight">
              Full feature comparison
            </h2>
            <p className="text-xl text-steel-600 max-w-2xl mx-auto">
              See exactly what's included in each plan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <ComparisonTable rows={comparisonRows} />
          </motion.div>
        </div>
      </Section>

      {/* FAQ */}
      <Section background="white" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="bg-steel-50 text-charcoal px-4 py-2 rounded-full text-sm font-semibold border border-steel-200">
                Got questions?
              </span>
            </div>
            <h2 className="text-display-sm text-charcoal mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-xl text-steel-600">
              Everything you need to know about pricing, process, and policies.
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem value={`item-${index}`} className="border-2 border-steel-200 rounded-xl px-6 bg-white hover:border-primary/30 hover:shadow-soft-md transition-all duration-200">
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="font-bold text-charcoal text-lg">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-steel-600 leading-relaxed text-base">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Compliance Note */}
      <Section background="default" className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-white to-steel-50 border-l-4 border-primary p-10 rounded-2xl shadow-soft-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-charcoal mb-4">
                  A note on compliance
                </h3>
                <p className="text-steel-600 leading-relaxed mb-4 text-base">
                  We implement websites and systems to meet technical standards like WCAG 2.1 AA,
                  GDPR data handling best practices, and security protocols. However, we are not lawyers
                  and do not provide legal compliance advice.
                </p>
                <p className="text-steel-600 leading-relaxed text-base">
                  For formal legal compliance certification (especially for regulated industries),
                  we recommend consulting with a qualified attorney alongside our technical implementation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* CTA */}
      <Section background="gradient" className="text-center py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <h2 className="text-display-sm md:text-display-md text-charcoal mb-6 tracking-tight">
            Still have questions?
          </h2>
          <p className="text-xl md:text-2xl text-steel-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Schedule a free 15-minute call. No pitch, just honest answers about what will work for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30" asChild>
              <Link href="/contact">Schedule a call</Link>
            </Button>
            <Button size="lg" variant="ghost" className="hover:border-primary hover:bg-white/50" asChild>
              <Link href="/services">View service packs</Link>
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
