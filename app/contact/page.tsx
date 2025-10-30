"use client"

import { motion } from "framer-motion"
import { Section } from "@/components/layout/Section"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Clock, MapPin, CheckCircle2 } from "lucide-react"

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

      {/* Contact Content */}
      <Section background="white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Main Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card elevation="md" className="p-10 bg-gradient-to-br from-white to-steel-50 border-2 border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-charcoal mb-1">Get in touch</h2>
                    <p className="text-steel-600">Drop us an email to discuss your project</p>
                  </div>
                </div>

                <a
                  href="mailto:info@vexnexa.com"
                  className="block w-full"
                >
                  <Button size="lg" className="w-full text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
                    Email us at info@vexnexa.com
                  </Button>
                </a>

                <div className="mt-8 pt-8 border-t border-steel-200">
                  <h3 className="font-bold text-charcoal mb-4">What to include in your email:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-steel-600">A brief description of your project or challenge</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-steel-600">Your timeline and any key deadlines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-steel-600">Budget range (helps us recommend the right approach)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-steel-600">Any specific requirements or challenges</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <Card elevation="sm" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal mb-2 text-lg">Response time</h3>
                    <p className="text-steel-600 leading-relaxed">
                      We aim to respond within 24 hours on business days. Usually much faster.
                    </p>
                  </div>
                </div>
              </Card>

              <Card elevation="sm" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal mb-2 text-lg">Location</h3>
                    <p className="text-steel-600 leading-relaxed">
                      Based in the Netherlands, working with clients globally. Timezone-flexible.
                    </p>
                  </div>
                </div>
              </Card>

              <Card elevation="sm" className="p-6 bg-gradient-to-br from-primary-50/30 to-white border-primary/20">
                <h3 className="font-bold text-charcoal mb-4 text-lg">
                  What to expect
                </h3>
                <ul className="space-y-3 text-steel-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">→</span>
                    <span>Free 15-minute consultation to discuss your needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">→</span>
                    <span>Honest assessment if we're the right fit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">→</span>
                    <span>Clear scope and pricing before any commitment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">→</span>
                    <span>No sales pitch or pressure—just straight talk</span>
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>
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
