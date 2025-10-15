"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import { LogoCloud } from "@/components/shared/LogoCloud"
import { FeatureList } from "@/components/shared/FeatureList"
import { Metrics } from "@/components/shared/Metrics"
import { Testimonial } from "@/components/shared/Testimonial"
import { PricingTable } from "@/components/pricing/PricingTable"
import Link from "next/link"
import {
  TrendingUp,
  Clock,
  Zap,
  Shield,
  Sparkles,
  Cog,
  Target,
  CheckCircle2,
  Globe,
  Workflow,
  Brain,
  Eye
} from "lucide-react"
import { logos, testimonials, pricingPlans, metrics, caseStudies } from "@/lib/data/fixture-data"

const capabilities = [
  { label: "Websites", color: "bg-blue-50 text-blue-600" },
  { label: "Automation", color: "bg-purple-50 text-purple-600" },
  { label: "AI", color: "bg-green-50 text-green-600" },
  { label: "Accessibility", color: "bg-orange-50 text-orange-600" },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Section className="pt-12 md:pt-20 pb-24 md:pb-32 relative overflow-hidden" background="gradient">
        <div className="absolute inset-0 bg-grid-subtle opacity-40" aria-hidden="true" />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-display-lg md:text-display-xl text-charcoal mb-6 text-balance">
              Build a smarter, faster, more{" "}
              <span className="text-primary">resilient</span> digital business.
            </h1>
            <p className="text-xl md:text-2xl text-steel-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              VexNexa helps you ship modern websites, automate operations, and integrate AI—without the chaos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?intent=project">Start a project</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/about#process">See how we work</Link>
              </Button>
            </div>
          </motion.div>

          <LogoCloud logos={logos} title="Trusted by forward-thinking teams" />

          {/* Capabilities Board Mock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {capabilities.map((item, index) => {
              const Icon = item.label === "Websites" ? Globe :
                          item.label === "Automation" ? Workflow :
                          item.label === "AI" ? Brain : Eye
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card elevation="md" className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-charcoal">{item.label}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Section>

      {/* Outcomes Section */}
      <Section background="white">
        <div className="text-center mb-16">
          <h2 className="text-display-md text-charcoal mb-4">
            Outcomes that matter
          </h2>
          <p className="text-xl text-steel-600 max-w-2xl mx-auto">
            We focus on measurable business impact, not just deliverables.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card elevation="md" className="h-full">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                <TrendingUp className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">More leads</h3>
              <p className="text-steel-600 mb-4 leading-relaxed">
                Conversion-optimized designs, fast-loading pages, and clear CTAs that turn visitors into customers.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-charcoal-dark">How we do it:</p>
                <ul className="space-y-1">
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    A/B tested layouts
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Mobile-first design
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Performance optimization
                  </li>
                </ul>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card elevation="md" className="h-full">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                <Clock className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">Less manual work</h3>
              <p className="text-steel-600 mb-4 leading-relaxed">
                Automated workflows that connect your tools and eliminate repetitive tasks.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-charcoal-dark">How we do it:</p>
                <ul className="space-y-1">
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    CRM integrations
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Auto-reporting
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Workflow automation
                  </li>
                </ul>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card elevation="md" className="h-full">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                <Zap className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">Faster delivery</h3>
              <p className="text-steel-600 mb-4 leading-relaxed">
                Ship quality work quickly with clear scopes, modern stacks, and proven processes.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-charcoal-dark">How we do it:</p>
                <ul className="space-y-1">
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    2-week sprints
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Agile methodology
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Reusable components
                  </li>
                </ul>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Card elevation="md" className="h-full">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                <Shield className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">Risk handled</h3>
              <p className="text-steel-600 mb-4 leading-relaxed">
                WCAG compliance, security best practices, and GDPR-ready implementations.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-charcoal-dark">How we do it:</p>
                <ul className="space-y-1">
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Accessibility audits
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Security reviews
                  </li>
                  <li className="text-sm text-steel-600 flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Compliance standards
                  </li>
                </ul>
              </div>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* How We Work Section */}
      <Section background="default">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-display-md text-charcoal mb-4">
              How we work
            </h2>
            <p className="text-xl text-steel-600">
              Clear process. Predictable timelines. No surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-steel-200" aria-hidden="true" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4 relative z-10 shadow-soft-md">
                  01
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-2">Discover</h3>
                <p className="text-steel-600 mb-2 leading-relaxed">
                  We start with your goals, not our stack. Quick kickoff call, clear scope, fixed timeline.
                </p>
                <span className="text-sm font-medium text-primary">1–2 days</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4 relative z-10 shadow-soft-md">
                  02
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-2">Deliver</h3>
                <p className="text-steel-600 mb-2 leading-relaxed">
                  Fast, focused sprints. Weekly check-ins. Real progress you can see and use.
                </p>
                <span className="text-sm font-medium text-primary">1–4 weeks</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4 relative z-10 shadow-soft-md">
                  03
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-2">Optimize</h3>
                <p className="text-steel-600 mb-2 leading-relaxed">
                  Launch support, analytics review, and ongoing improvements if needed.
                </p>
                <span className="text-sm font-medium text-primary">Ongoing</span>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Solutions Teaser Section */}
      <Section background="white">
        <div className="text-center mb-16">
          <h2 className="text-display-md text-charcoal mb-4">
            What we build
          </h2>
          <p className="text-xl text-steel-600 max-w-2xl mx-auto">
            From quick wins to scalable systems—choose what fits your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/solutions#websites">
              <Card elevation="md" className="h-full hover:border-primary transition-colors">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <Globe className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-3">Websites</h3>
                <p className="text-steel-600 mb-4 leading-relaxed">
                  Modern, fast, conversion-focused sites that work across all devices.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Mobile-first responsive design
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    90+ Lighthouse performance
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    SEO & accessibility built-in
                  </li>
                </ul>
                <div className="mt-6">
                  <span className="text-primary font-medium hover:underline">Learn more →</span>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/solutions#automation">
              <Card elevation="md" className="h-full hover:border-primary transition-colors">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <Workflow className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-3">Automation</h3>
                <p className="text-steel-600 mb-4 leading-relaxed">
                  Connect your tools and eliminate hours of manual work every week.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    CRM & tool integrations
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Automated reporting
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Custom workflow triggers
                  </li>
                </ul>
                <div className="mt-6">
                  <span className="text-primary font-medium hover:underline">Learn more →</span>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/solutions#ai">
              <Card elevation="md" className="h-full hover:border-primary transition-colors">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <Brain className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-3">AI & Integrations</h3>
                <p className="text-steel-600 mb-4 leading-relaxed">
                  Deploy AI assistants that actually help your team ship faster.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Retrieval-ready chatbots
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Knowledge base setup
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Safe, tested guardrails
                  </li>
                </ul>
                <div className="mt-6">
                  <span className="text-primary font-medium hover:underline">Learn more →</span>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/solutions#accessibility">
              <Card elevation="md" className="h-full hover:border-primary transition-colors">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <Eye className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-3">Accessibility & Compliance</h3>
                <p className="text-steel-600 mb-4 leading-relaxed">
                  WCAG audits, remediation, and ongoing compliance support.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Comprehensive WCAG 2.1 AA audits
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Priority remediation plans
                  </li>
                  <li className="flex items-start text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    Retest & compliance reports
                  </li>
                </ul>
                <div className="mt-6">
                  <span className="text-primary font-medium hover:underline">Learn more →</span>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" size="lg" asChild>
            <Link href="/solutions">View all solutions</Link>
          </Button>
        </div>
      </Section>

      {/* Case Study Highlight */}
      <Section background="default">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Case Study
            </span>
            <h2 className="text-display-sm text-charcoal mt-4 mb-6">
              TechFlow: 38% boost in conversions with modern redesign
            </h2>
            <p className="text-lg text-steel-600 mb-6 leading-relaxed">
              TechFlow's outdated website was losing leads. We delivered a complete redesign
              with mobile-first UX, conversion-focused landing pages, and 92% faster load times.
            </p>
            <Metrics
              metrics={[
                { value: "+38%", label: "form conversions", highlighted: true },
                { value: "-60%", label: "admin time" },
                { value: "<300ms", label: "LCP" },
              ]}
              layout="chips"
              className="mb-8"
            />
            <Button variant="ghost" asChild>
              <Link href="/cases">View all case studies →</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card elevation="lg" className="p-0 overflow-hidden">
              <div className="bg-gradient-to-br from-primary/20 to-purple-100 h-96 flex items-center justify-center">
                <p className="text-steel-600">[Case study visual / UI mock]</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* Pricing Teaser */}
      <Section background="white">
        <div className="text-center mb-16">
          <h2 className="text-display-md text-charcoal mb-4">
            Transparent pricing
          </h2>
          <p className="text-xl text-steel-600 max-w-2xl mx-auto">
            Choose a plan that fits your needs. Scale up or down as you grow.
          </p>
        </div>

        <PricingTable plans={pricingPlans} />

        <div className="text-center mt-12">
          <Button variant="ghost" size="lg" asChild>
            <Link href="/pricing">See full pricing details →</Link>
          </Button>
        </div>
      </Section>

      {/* Testimonials */}
      <Section background="default">
        <div className="text-center mb-16">
          <h2 className="text-display-md text-charcoal mb-4">
            What our clients say
          </h2>
          <p className="text-xl text-steel-600">
            Real results from real partnerships.
          </p>
        </div>

        <Testimonial items={testimonials} layout="grid" />
      </Section>

      {/* Final CTA */}
      <Section background="gradient" className="text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-md text-charcoal mb-6">
              Ready to move faster?
            </h2>
            <p className="text-xl text-steel-600 mb-8">
              Let's talk about your project. No sales pitch—just a straight conversation
              about what you need and how we can help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact?intent=project">Start a project</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
