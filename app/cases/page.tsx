"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import { Metrics } from "@/components/shared/Metrics"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { caseStudies } from "@/lib/data/fixture-data"

export default function CasesPage() {
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
            Real results from real <span className="text-primary">partnerships</span>
          </h1>
          <p className="text-xl text-steel-600 max-w-3xl mx-auto mb-8">
            See how we've helped businesses modernize websites, automate workflows, and accelerate digital growth.
          </p>
        </motion.div>
      </Section>

      {/* Case Studies Grid */}
      <Section background="white">
        <div className="grid lg:grid-cols-2 gap-8">
          {caseStudies.map((caseStudy, index) => (
            <motion.div
              key={caseStudy.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/cases/${caseStudy.slug}`}>
                <Card elevation="md" className="h-full hover:border-primary transition-all group">
                  {/* Case Image */}
                  <div className="bg-gradient-to-br from-primary/20 to-purple-100 h-64 flex items-center justify-center mb-6 rounded-lg overflow-hidden">
                    <p className="text-steel-600">[Case study visual]</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {caseStudy.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-steel-100 text-steel-700 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Content */}
                  <h2 className="text-2xl font-bold text-charcoal mb-2 group-hover:text-primary transition-colors">
                    {caseStudy.title}
                  </h2>
                  <p className="text-sm text-steel-500 mb-4">
                    {caseStudy.client} • {caseStudy.industry}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal mb-1">Challenge</h3>
                      <p className="text-steel-600 leading-relaxed">{caseStudy.challenge}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal mb-1">Solution</h3>
                      <p className="text-steel-600 leading-relaxed">{caseStudy.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="pt-6 border-t border-steel-200">
                    <h3 className="text-sm font-semibold text-charcoal mb-4">Results</h3>
                    <Metrics
                      metrics={caseStudy.results.map(r => ({ value: r.value, label: r.label }))}
                      layout="chips"
                    />
                  </div>

                  <div className="mt-6 flex items-center text-primary font-medium group-hover:underline">
                    Read full case study <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Stats Overview */}
      <Section background="default">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-display-sm text-charcoal mb-12">
            By the numbers
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50+", label: "Projects delivered" },
              { value: "98%", label: "Client satisfaction" },
              { value: "2.5x", label: "Avg. ROI increase" },
              { value: "<3 weeks", label: "Avg. delivery time" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-steel-600">{stat.label}</div>
              </motion.div>
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
            Want results like these?
          </h2>
          <p className="text-xl text-steel-600 mb-8 max-w-2xl mx-auto">
            Let's talk about your project and explore what's possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Start a project</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/services">View services</Link>
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
