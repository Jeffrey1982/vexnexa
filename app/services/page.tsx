"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import Link from "next/link"
import { Check, Clock, DollarSign, FileText } from "lucide-react"
import { services } from "@/lib/data/fixture-data"

export default function ServicesPage() {
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
            Fixed-scope <span className="text-primary">service packs</span>
          </h1>
          <p className="text-xl text-steel-600 max-w-3xl mx-auto mb-8">
            Clear deliverables. Predictable timelines. No hourly billing surprises.
          </p>
        </motion.div>
      </Section>

      {/* Services Grid */}
      <Section background="white">
        <div className="grid gap-12">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card elevation="md" className="overflow-hidden">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left: Service Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-display-xs text-charcoal mb-2">
                        {service.name}
                      </h2>
                      <p className="text-lg text-steel-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">
                        What You Get
                      </h3>
                      <ul className="grid sm:grid-cols-2 gap-3">
                        {service.deliverables.map((item) => (
                          <li key={item} className="flex items-start">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                            <span className="text-steel-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">
                        What We Need From You
                      </h3>
                      <ul className="space-y-2">
                        {service.whatWeNeed.map((item) => (
                          <li key={item} className="flex items-start">
                            <FileText className="w-4 h-4 text-steel-500 flex-shrink-0 mr-3 mt-0.5" />
                            <span className="text-sm text-steel-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right: Pricing & CTA */}
                  <div className="lg:border-l lg:border-steel-200 lg:pl-8 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-charcoal">Duration</span>
                      </div>
                      <p className="text-2xl font-bold text-charcoal">{service.duration}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-charcoal">Investment</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{service.price}</p>
                    </div>

                    <Button className="w-full" size="lg" asChild>
                      <Link href={`/contact?service=${service.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        Get started
                      </Link>
                    </Button>

                    <div className="pt-6 border-t border-steel-200">
                      <p className="text-xs text-steel-600 leading-relaxed">
                        Fixed scope. No hourly billing. If requirements change, we'll create a new scope together.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it Works */}
      <Section background="default">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              How service packs work
            </h2>
            <p className="text-lg text-steel-600">
              Simple, transparent process from start to finish.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Book a call",
                description: "15-minute chat to confirm scope and fit. If it's not a match, we'll tell you honestly.",
              },
              {
                step: "2",
                title: "Kick off & deliver",
                description: "We start immediately. Weekly updates. Clear milestones. You approve at each stage.",
              },
              {
                step: "3",
                title: "Launch & support",
                description: "Final handoff with documentation. 30-day support included for tweaks and questions.",
              },
            ].map((phase, index) => (
              <motion.div
                key={phase.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card elevation="sm" className="text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {phase.step}
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal mb-2">
                    {phase.title}
                  </h3>
                  <p className="text-steel-600 leading-relaxed">
                    {phase.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-display-sm text-charcoal mb-8 text-center">
            Common questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "What if my project doesn't fit a service pack?",
                a: "No problem. We'll create a custom scope and quote. Service packs are just our most common requests packaged for speed.",
              },
              {
                q: "Can I combine multiple packs?",
                a: "Absolutely. Many clients start with a Website Sprint, then add Automation or AI later. We offer bundle discounts for multi-pack projects.",
              },
              {
                q: "What happens if we need changes mid-project?",
                a: "Minor tweaks are fine. Major scope changes require a new agreement. We'll pause, re-scope, and get your approval before continuing.",
              },
              {
                q: "Do you offer ongoing support after delivery?",
                a: "30 days of support is included. After that, you can book a Growth or Scale retainer for ongoing work.",
              },
              {
                q: "What if I'm not happy with the work?",
                a: "We work in sprints with approval checkpoints. If something's off, we fix it before moving forward. No surprises at the end.",
              },
            ].map((faq, index) => (
              <Card key={index} elevation="sm" className="p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  {faq.q}
                </h3>
                <p className="text-steel-600 leading-relaxed">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
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
            Ready to get started?
          </h2>
          <p className="text-xl text-steel-600 mb-8 max-w-2xl mx-auto">
            Pick a service pack or schedule a call to discuss your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact?intent=service">Book a call</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/pricing">View pricing plans</Link>
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
