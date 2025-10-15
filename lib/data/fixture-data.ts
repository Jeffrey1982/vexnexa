// Fixture data for the VexNexa marketing site

export const logos = [
  { name: "Company 1", src: "/logos/logo-1.svg" },
  { name: "Company 2", src: "/logos/logo-2.svg" },
  { name: "Company 3", src: "/logos/logo-3.svg" },
  { name: "Company 4", src: "/logos/logo-4.svg" },
  { name: "Company 5", src: "/logos/logo-5.svg" },
  { name: "Company 6", src: "/logos/logo-6.svg" },
  { name: "Company 7", src: "/logos/logo-7.svg" },
]

export const testimonials = [
  {
    quote: "VexNexa transformed our outdated website into a modern, high-converting experience. We saw a 38% increase in form submissions within the first month.",
    author: "Sarah Mitchell",
    role: "Marketing Director",
    company: "TechFlow Solutions",
    verified: true,
  },
  {
    quote: "The automation workflows they built saved us 15 hours per week. Our team can now focus on growth instead of repetitive admin tasks.",
    author: "Marcus Chen",
    role: "Operations Manager",
    company: "GrowthLabs",
    verified: true,
  },
  {
    quote: "Best investment we made this year. Professional, responsive, and they actually understand business needs—not just tech specs.",
    author: "Emma Rodriguez",
    role: "CEO",
    company: "Innovate Agency",
    verified: true,
  },
]

export const caseStudies = [
  {
    slug: "techflow-website-redesign",
    title: "TechFlow: Website Redesign & Optimization",
    client: "TechFlow Solutions",
    industry: "SaaS",
    challenge: "Outdated website with poor mobile experience and low conversion rates",
    solution: "Complete redesign with modern UI, improved UX, and conversion-focused landing pages",
    results: [
      { label: "form conversions", value: "+38%" },
      { label: "page speed", value: "+92%" },
      { label: "mobile traffic", value: "+156%" },
    ],
    image: "/cases/techflow.jpg",
    tags: ["Website", "UX/UI", "Performance"],
  },
  {
    slug: "growthlabs-automation",
    title: "GrowthLabs: Workflow Automation",
    client: "GrowthLabs",
    industry: "Marketing Agency",
    challenge: "Manual data entry and disconnected tools causing bottlenecks",
    solution: "Custom automation workflows connecting CRM, invoicing, and reporting systems",
    results: [
      { label: "admin time saved", value: "-60%" },
      { label: "data accuracy", value: "99.8%" },
      { label: "ROI", value: "320%" },
    ],
    image: "/cases/growthlabs.jpg",
    tags: ["Automation", "Integration", "Efficiency"],
  },
]

export const pricingPlans = [
  {
    name: "Starter",
    description: "Perfect for quick wins and single projects",
    price: {
      monthly: "€1.5k–€3k",
      quarterly: "€4k–€8k",
    },
    features: [
      "Clear scope, fixed deliverables",
      "2–4 week delivery",
      "Landing page or small site",
      "Basic SEO optimization",
      "Email support",
    ],
    cta: "Start a project",
    ctaLink: "/contact?plan=starter",
    limits: "One-time project",
  },
  {
    name: "Growth",
    description: "Ongoing development & optimization",
    price: {
      monthly: "€1k–€3k",
      quarterly: "€2.5k–€8k",
    },
    features: [
      "Monthly roadmap planning",
      "Continuous improvements",
      "Priority support",
      "Analytics & reporting",
      "Up to 20 hours/month",
    ],
    cta: "Get started",
    ctaLink: "/contact?plan=growth",
    popular: true,
    limits: "Monthly retainer",
  },
  {
    name: "Scale",
    description: "Full product team extension",
    price: {
      monthly: "€3k–€8k",
      quarterly: "€8k–€20k",
    },
    features: [
      "Dedicated team access",
      "Custom integrations",
      "Advanced automation",
      "SLA & response times",
      "40+ hours/month",
    ],
    cta: "Let's talk",
    ctaLink: "/contact?plan=scale",
    limits: "Quarterly minimum",
  },
  {
    name: "Custom",
    description: "Tailored for enterprise needs",
    price: {
      monthly: "Custom",
      quarterly: "Custom",
    },
    features: [
      "Everything in Scale",
      "Multi-team coordination",
      "Compliance & security",
      "Custom SLAs",
      "Flexible engagement",
    ],
    cta: "Contact sales",
    ctaLink: "/contact?plan=custom",
  },
]

export const comparisonRows = [
  {
    feature: "Strategy & Planning",
    starter: "Project scope",
    growth: "Monthly roadmap",
    scale: "Quarterly strategy",
    custom: "Enterprise planning",
  },
  {
    feature: "Design System",
    starter: true,
    growth: true,
    scale: true,
    custom: true,
  },
  {
    feature: "Custom Development",
    starter: "Basic",
    growth: "Standard",
    scale: "Advanced",
    custom: "Enterprise",
  },
  {
    feature: "Automation Workflows",
    starter: false,
    growth: "Up to 3",
    scale: "Unlimited",
    custom: "Unlimited",
  },
  {
    feature: "AI Integration",
    starter: false,
    growth: "Basic",
    scale: "Advanced",
    custom: "Custom solutions",
  },
  {
    feature: "Accessibility Audit",
    starter: "Basic",
    growth: true,
    scale: true,
    custom: true,
  },
  {
    feature: "Support Response",
    starter: "48 hours",
    growth: "24 hours",
    scale: "4 hours",
    custom: "Custom SLA",
  },
  {
    feature: "Monthly Reporting",
    starter: false,
    growth: true,
    scale: true,
    custom: true,
  },
]

export const services = [
  {
    name: "Website Sprint",
    duration: "2 weeks",
    price: "From €2,500",
    description: "Modern, conversion-focused website from strategy to launch",
    deliverables: [
      "Design system & component library",
      "5–10 page website with CMS",
      "Mobile-first responsive design",
      "Basic SEO optimization",
      "Performance optimization (90+ Lighthouse)",
    ],
    whatWeNeed: [
      "Brand assets (logo, colors, fonts)",
      "Content or content outline",
      "Access to hosting/domain",
    ],
  },
  {
    name: "Automation Sprint",
    duration: "10 days",
    price: "From €1,800",
    description: "Connect your tools and eliminate manual workflows",
    deliverables: [
      "Up to 3 workflow automations",
      "CRM/tool integrations",
      "Automated reporting",
      "Documentation & training",
      "30-day support period",
    ],
    whatWeNeed: [
      "Access to tools/APIs",
      "Current process documentation",
      "Key stakeholder availability",
    ],
  },
  {
    name: "AI Assist Setup",
    duration: "10 days",
    price: "From €2,200",
    description: "Deploy AI that actually helps your team work faster",
    deliverables: [
      "Retrieval-ready chatbot",
      "Knowledge base setup",
      "Guardrails & safety measures",
      "Team training",
      "Usage analytics dashboard",
    ],
    whatWeNeed: [
      "Content/documentation to train on",
      "Use cases & requirements",
      "API access if integrating",
    ],
  },
  {
    name: "Accessibility Upgrade",
    duration: "1–2 weeks",
    price: "From €1,500",
    description: "WCAG compliance audit + remediation",
    deliverables: [
      "Comprehensive WCAG 2.1 AA audit",
      "Prioritized remediation plan",
      "Code fixes for critical issues",
      "Retest & compliance report",
      "Team best practices guide",
    ],
    whatWeNeed: [
      "Website URL or staging access",
      "Target compliance level",
      "Development environment access",
    ],
  },
]

export const metrics = {
  home: [
    { value: "+38%", label: "form conversions" },
    { value: "-60%", label: "manual admin time" },
    { value: "<300ms", label: "average LCP" },
  ],
}
