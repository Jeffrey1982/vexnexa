"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import Link from "next/link"
import { Target, Zap, Shield, Users, Clock, TrendingUp } from "lucide-react"

const principles = [
  {
    icon: Target,
    title: "Outcomes over outputs",
    description: "We measure success by business impact, not lines of code or number of features.",
  },
  {
    icon: Zap,
    title: "Speed wins",
    description: "Fast feedback loops, weekly shipping, and no multi-month timelines for simple projects.",
  },
  {
    icon: Shield,
    title: "Quality is non-negotiable",
    description: "Performance, accessibility, and security are built-in from day one—not afterthoughts.",
  },
  {
    icon: Users,
    title: "Transparent partnerships",
    description: "No jargon, no hidden fees, no surprises. We talk straight and work collaboratively.",
  },
]

const process = [
  {
    phase: "Discover",
    duration: "1–2 days",
    steps: [
      "Kickoff call to understand goals, constraints, and success metrics",
      "Review existing systems, tools, and pain points",
      "Define clear scope with deliverables and timeline",
      "Sign off on project plan before any work begins",
    ],
  },
  {
    phase: "Deliver",
    duration: "1–4 weeks",
    steps: [
      "Weekly check-ins with demos and progress updates",
      "Work in small sprints with approval checkpoints",
      "Real-time collaboration via Slack or preferred tool",
      "Iterate based on feedback without scope creep",
    ],
  },
  {
    phase: "Optimize",
    duration: "Ongoing",
    steps: [
      "Launch support with full documentation and handoff",
      "30-day post-launch support for bugs and tweaks",
      "Analytics review and recommendations",
      "Optional retainer for ongoing improvements",
    ],
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-12 md:pt-20 pb-16" background="gradient">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-display-lg md:text-display-xl text-charcoal mb-6">
              We help SMEs <span className="text-primary">modernize</span>—without pausing the business
            </h1>
            <p className="text-xl text-steel-600 leading-relaxed">
              VexNexa is a small, focused team building digital tools that work.
              We specialize in websites, automation, AI integration, and accessibility
              for companies that need pragmatic solutions, not enterprise bloat.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Why VexNexa */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              Why VexNexa?
            </h2>
            <p className="text-lg text-steel-600">
              We're not the cheapest, and we're not the biggest. But we're fast,
              transparent, and focused on delivering solutions that drive real business value.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Clock,
                title: "We ship fast",
                description: "Most projects take 1–4 weeks, not months. We work in tight sprints with weekly progress you can see and use.",
              },
              {
                icon: Target,
                title: "We focus on outcomes",
                description: "More leads, less manual work, faster delivery. We measure success by business impact, not feature count.",
              },
              {
                icon: TrendingUp,
                title: "We scale with you",
                description: "Start with a quick win, grow into a retainer, or book one-off projects as needed. No long-term lock-ins.",
              },
              {
                icon: Shield,
                title: "We handle the hard stuff",
                description: "Accessibility, performance, security, compliance—we build it right the first time so you don't have to fix it later.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card elevation="sm" className="h-full">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal mb-2">
                    {item.title}
                  </h3>
                  <p className="text-steel-600 leading-relaxed">
                    {item.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Principles */}
      <Section background="default">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              Our principles
            </h2>
            <p className="text-lg text-steel-600">
              The values that guide every project we take on.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <principle.icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-charcoal mb-2">
                    {principle.title}
                  </h3>
                  <p className="text-steel-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Process */}
      <Section background="white" id="process">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              How we work
            </h2>
            <p className="text-lg text-steel-600">
              Clear process, predictable timelines, no surprises.
            </p>
          </div>

          <div className="space-y-8">
            {process.map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card elevation="md" className="overflow-hidden">
                  <div className="grid lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 bg-primary/5 lg:bg-transparent p-6 lg:p-0 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start">
                      <div className="text-center lg:text-left">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h3 className="text-2xl font-bold text-charcoal mb-2">
                          {phase.phase}
                        </h3>
                        <span className="text-sm font-medium text-steel-600">
                          {phase.duration}
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <ul className="space-y-3">
                        {phase.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                              {stepIndex + 1}
                            </span>
                            <span className="text-steel-600 leading-relaxed">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Team Note */}
      <Section background="default">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-xs text-charcoal mb-4">
              Lean team, proven expertise
            </h2>
            <p className="text-lg text-steel-600 leading-relaxed mb-6">
              We're a focused team of designers, developers, and strategists who've worked
              with startups, agencies, and SMEs across Europe. Our streamlined structure
              enables rapid execution and direct communication with stakeholders.
            </p>
            <p className="text-steel-600 leading-relaxed">
              Based in the Netherlands, working with clients globally. Remote-first,
              async-friendly, and timezone-flexible.
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
            Let's work together
          </h2>
          <p className="text-xl text-steel-600 mb-8 max-w-2xl mx-auto">
            Ready to modernize your digital presence? Schedule a free consultation
            to discuss your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Start a project</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/cases">View case studies</Link>
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
