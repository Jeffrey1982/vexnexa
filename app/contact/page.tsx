"use client"

import { motion } from "framer-motion"
import { Section } from "@/components/layout/Section"
import { Card } from "@/components/ui/card"
import { ContactForm } from "@/components/forms/ContactForm"
import { Mail, Clock, MapPin } from "lucide-react"

export default function ContactPage() {
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
            Let's <span className="text-primary">talk</span>
          </h1>
          <p className="text-xl text-steel-600 max-w-3xl mx-auto mb-8">
            Ready to start a project? Have questions about pricing or process?
            Reach out—we'll get back to you within 24 hours.
          </p>
        </motion.div>
      </Section>

      {/* Contact Form + Info */}
      <Section background="white">
        <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-display-xs text-charcoal mb-2">
                Send us a message
              </h2>
              <p className="text-steel-600 mb-8">
                Fill out the form below and we'll get back to you within one business day.
              </p>
              <ContactForm />
            </motion.div>
          </div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card elevation="sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">Email</h3>
                  <a
                    href="mailto:info@vexnexa.com"
                    className="text-steel-600 hover:text-primary transition-colors"
                  >
                    info@vexnexa.com
                  </a>
                </div>
              </div>
            </Card>

            <Card elevation="sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">Response time</h3>
                  <p className="text-steel-600">
                    Within 24 hours on business days
                  </p>
                </div>
              </div>
            </Card>

            <Card elevation="sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">Location</h3>
                  <p className="text-steel-600">
                    Based in the Netherlands
                    <br />
                    Working with clients globally
                  </p>
                </div>
              </div>
            </Card>

            <div className="pt-6">
              <h3 className="font-semibold text-charcoal mb-3">
                What to expect
              </h3>
              <ul className="space-y-2 text-sm text-steel-600">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Free 15-minute consultation to discuss your needs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Honest assessment if we're the right fit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Clear scope and pricing before any commitment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>No sales pitch or pressure—just straight talk</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* FAQ */}
      <Section background="default">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-display-sm text-charcoal mb-8 text-center">
            Before you reach out
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Do you offer free consultations?",
                a: "Yes. We offer a free 15-minute call to discuss your project and determine if we're a good fit.",
              },
              {
                q: "What information should I include in my message?",
                a: "Tell us about your project goals, timeline, and any specific challenges you're facing. The more context, the better we can help.",
              },
              {
                q: "How quickly can you start?",
                a: "Most projects can start within 1–2 weeks. For urgent requests, we can sometimes accommodate faster timelines.",
              },
              {
                q: "Do you work with clients outside the Netherlands?",
                a: "Absolutely. We work with clients globally and are timezone-flexible.",
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
    </>
  )
}
