"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Globe, Workflow, Brain, Eye, Check, ArrowRight, X } from "lucide-react"

const solutions = [
  {
    id: "websites",
    icon: Globe,
    title: "Websites",
    tagline: "Modern, fast, conversion-focused",
    problem: "Your website is slow, outdated, or not converting visitors into customers. Mobile traffic bounces. Updates take forever.",
    approach: "We build mobile-first, performance-optimized websites with clear CTAs, modern design systems, and easy-to-manage CMSes.",
    deliverables: [
      "Design system & component library",
      "5-15 page responsive website",
      "Headless CMS integration (Sanity, Contentful, or similar)",
      "90+ Lighthouse performance score",
      "Basic SEO optimization",
      "Google Analytics & tracking setup",
    ],
    timeline: "2–4 weeks",
    tools: ["Next.js", "React", "TailwindCSS", "Sanity CMS", "Vercel"],
    example: "Landing page with 3 service pages, blog, contact form—delivered in 2 weeks with 95 Lighthouse score.",
  },
  {
    id: "automation",
    icon: Workflow,
    title: "Automation",
    tagline: "Eliminate manual work",
    problem: "Your team wastes hours on repetitive tasks: copying data between tools, manual reporting, chasing updates in Slack.",
    approach: "We map your workflows, identify bottlenecks, and build custom automations that connect your tools seamlessly.",
    deliverables: [
      "Process mapping & bottleneck analysis",
      "Up to 5 automated workflows",
      "CRM, invoicing, and tool integrations",
      "Automated reporting dashboards",
      "Documentation & team training",
      "30-day support & refinement period",
    ],
    timeline: "1–2 weeks",
    tools: ["Make (Integromat)", "Zapier", "n8n", "Custom APIs", "Webhooks"],
    example: "Auto-sync leads from website → CRM → Slack → weekly report. Saved 12 hours/week.",
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI & Integrations",
    tagline: "Deploy AI that actually helps",
    problem: "You want to use AI, but don't know where to start—or you tried ChatGPT and it hallucinated useless answers.",
    approach: "We build retrieval-augmented chatbots trained on your knowledge base, with guardrails to prevent bad outputs.",
    deliverables: [
      "Custom AI assistant (GPT-4, Claude, or similar)",
      "Knowledge base setup (docs, FAQs, internal wikis)",
      "Guardrails & safety measures",
      "Integration with Slack, web, or internal tools",
      "Usage analytics dashboard",
      "Team training & prompt engineering guides",
    ],
    timeline: "10–14 days",
    tools: ["OpenAI API", "LangChain", "Pinecone", "Supabase", "Custom backends"],
    example: "Support bot answering 80% of common questions, reducing ticket volume by 60%.",
  },
  {
    id: "accessibility",
    icon: Eye,
    title: "Accessibility & Compliance",
    tagline: "WCAG compliance made simple",
    problem: "Your site fails accessibility checks. You're worried about legal risk or losing customers who can't use your product.",
    approach: "We audit your site against WCAG 2.1 AA standards, prioritize fixes, and implement changes with full documentation.",
    deliverables: [
      "Comprehensive WCAG 2.1 AA audit",
      "Prioritized remediation roadmap",
      "Code fixes for critical issues",
      "Keyboard navigation & screen reader testing",
      "Retest & compliance report",
      "Team best practices guide",
    ],
    timeline: "1–2 weeks",
    tools: ["axe DevTools", "WAVE", "NVDA", "VoiceOver", "Manual testing"],
    example: "E-commerce site brought to full WCAG AA compliance in 10 days, including retest certification.",
  },
]

const comparisonData = [
  {
    factor: "Cost",
    diy: "$0 upfront, high time cost",
    vexnexa: "Fixed price, clear ROI",
    fulltime: "$60k–$120k/year + benefits",
  },
  {
    factor: "Timeline",
    diy: "Months (learning curve)",
    vexnexa: "1–4 weeks",
    fulltime: "Weeks to hire + onboard",
  },
  {
    factor: "Quality",
    diy: "Depends on your skill",
    vexnexa: "Proven, production-grade",
    fulltime: "Variable (depends on hire)",
  },
  {
    factor: "Flexibility",
    diy: "Full control",
    vexnexa: "Scope-based, scalable",
    fulltime: "Limited by capacity",
  },
  {
    factor: "Support",
    diy: "Stack Overflow",
    vexnexa: "30-day support included",
    fulltime: "Depends on team",
  },
]

export default function SolutionsPage() {
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
            Solutions built for <span className="text-primary">results</span>
          </h1>
          <p className="text-xl text-steel-600 max-w-3xl mx-auto mb-8">
            From quick wins to scalable systems—we help you modernize without pausing the business.
          </p>
        </motion.div>
      </Section>

      {/* Solutions Tabs */}
      <Section background="white">
        <Tabs defaultValue="websites" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-12">
            {solutions.map((solution) => (
              <TabsTrigger key={solution.id} value={solution.id} className="flex items-center gap-2">
                <solution.icon className="w-4 h-4" />
                {solution.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {solutions.map((solution) => (
            <TabsContent key={solution.id} value={solution.id}>
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <solution.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-display-sm text-charcoal">{solution.title}</h2>
                      <p className="text-primary font-medium">{solution.tagline}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-2">The Problem</h3>
                      <p className="text-steel-600 leading-relaxed">{solution.problem}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-2">Our Approach</h3>
                      <p className="text-steel-600 leading-relaxed">{solution.approach}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-2">Example Result</h3>
                      <Card className="bg-primary/5 border-primary/20">
                        <p className="text-charcoal leading-relaxed">{solution.example}</p>
                      </Card>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card elevation="md">
                    <h3 className="text-xl font-semibold text-charcoal mb-4">What You Get</h3>
                    <ul className="space-y-3 mb-6">
                      {solution.deliverables.map((item) => (
                        <li key={item} className="flex items-start">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                          <span className="text-steel-600">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4 border-t border-steel-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-charcoal">Timeline</span>
                        <span className="text-primary font-medium">{solution.timeline}</span>
                      </div>
                      <div className="mb-6">
                        <span className="text-sm font-semibold text-charcoal block mb-2">Tools & Stack</span>
                        <div className="flex flex-wrap gap-2">
                          {solution.tools.map((tool) => (
                            <span
                              key={tool}
                              className="px-3 py-1 bg-steel-100 text-steel-700 text-xs rounded-full"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button className="w-full" asChild>
                        <Link href={`/contact?solution=${solution.id}`}>
                          Get started <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      {/* Comparison Section */}
      <Section background="default">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-sm text-charcoal mb-4">
              DIY vs VexNexa vs Hiring Full-time
            </h2>
            <p className="text-lg text-steel-600">
              Choose the approach that fits your budget, timeline, and goals.
            </p>
          </div>

          <Card elevation="md" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-steel-50">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-charcoal">Factor</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-steel-600">DIY</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-primary">VexNexa</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-steel-600">Full-time Hire</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={row.factor} className={index % 2 === 0 ? "bg-white" : "bg-steel-50/50"}>
                      <td className="py-4 px-6 font-medium text-charcoal">{row.factor}</td>
                      <td className="py-4 px-4 text-center text-sm text-steel-600">{row.diy}</td>
                      <td className="py-4 px-4 text-center text-sm font-medium text-charcoal">{row.vexnexa}</td>
                      <td className="py-4 px-4 text-center text-sm text-steel-600">{row.fulltime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
            Not sure which solution fits?
          </h2>
          <p className="text-xl text-steel-600 mb-8 max-w-2xl mx-auto">
            Book a free 30-minute consultation. We'll help you figure out the right approach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Schedule a call</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/services">Browse service packs</Link>
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
