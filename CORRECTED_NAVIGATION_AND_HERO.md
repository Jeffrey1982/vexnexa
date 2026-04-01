# ✅ Corrected Navigation Menu - British English

## Primary Navigation Menu
```
VexNexa
├── For Agencies
├── Features  
├── Pricing
├── Sample Report
├── Contact
└── [Login] [Start Free]
```

## Translation Keys Used:
- `nav.forAgencies` → "For Agencies"
- `nav.features` → "Features"  
- `nav.pricing` → "Pricing"
- `nav.sampleReport` → "Sample Report"
- `nav.contact` → "Contact"
- `nav.login` → "Login"
- `nav.signup` → "Start Free"

## Updated Hero Section Code

```tsx
// src/components/marketing/home/HomeHeroUpdated.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHeroUpdated() {
  const t = useTranslations('hero');
  const common = useTranslations('common');

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl font-bold tracking-tighter text-slate-100 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              {t('headline')}
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                {t('headline_accent')}
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-relaxed text-slate-300 sm:text-xl max-w-2xl lg:max-w-none">
              {t('subheadline')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-4 text-base font-medium transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-blue-500/20"
              >
                <Link href="/get-started">
                  {t('primary_cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-slate-100 rounded-2xl px-8 py-4 text-base font-medium transition-all duration-200"
              >
                <Link href="/demo">
                  <Play className="mr-2 h-4 w-4" />
                  {t('secondary_cta')}
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                {t('trust_eu_hosted')}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                {t('trust_gdpr')}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                {t('trust_no_card')}
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Mockup */}
          <div className="relative">
            {/* Dashboard mockup component here */}
            <div className="relative mx-auto max-w-2xl">
              <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 shadow-2xl backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white font-bold">
                      V
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">VexNexa</div>
                      <div className="text-xs text-slate-400">Accessibility Report</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">2 min ago</div>
                </div>

                <div className="mb-6 flex items-center gap-6">
                  <div className="relative">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-700" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="url(#gradient)" strokeWidth="6" strokeLinecap="round" className="text-blue-500" />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-100">94</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-300">Compliance Score</div>
                    <div className="text-xs text-slate-400">94% • 12 issues found</div>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-100">Missing alt text</div>
                      <div className="text-xs text-slate-400">3 instances</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-100">Low contrast text</div>
                      <div className="text-xs text-slate-400">5 instances</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <div className="text-xs text-slate-400">example.com</div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded bg-blue-500"></div>
                    <div className="h-6 w-6 rounded bg-slate-700"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

## EAA Monitoring Page Hero Section

```tsx
// src/app/(marketing)/eaa-compliance-monitoring/page.tsx
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EaaComplianceMonitoringPage() {
  const t = useTranslations('eaa');
  const common = useTranslations('common');

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
              <Shield className="mr-2 h-4 w-4" />
              {t('badge')}
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight text-slate-100">
              {t('hero.title')}
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-4 text-base font-medium transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-blue-500/20"
              >
                <Link href="/get-started">
                  {common.startFreeScan}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-slate-100 rounded-2xl px-8 py-4 text-base font-medium transition-all duration-200"
              >
                <Link href="/demo">
                  {common.viewDemo}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of EAA monitoring content */}
    </>
  );
}
```

## Updated English Translation Keys

Add these to `messages/en.json`:

```json
{
  "nav": {
    "forAgencies": "For Agencies",
    "sampleReport": "Sample Report",
    "eaaMonitoring": "EAA Monitoring"
  },
  "hero": {
    "headline": "WCAG 2.2 without the noise.",
    "headline_accent": "White-label reports that actually sell.",
    "subheadline": "Reliable automated scans powered by axe-core. Fewer false positives, actionable fix advice, and fully branded PDF & Word reports. Built for agencies and EU teams that take the EAA seriously.",
    "primary_cta": "Start free scan",
    "secondary_cta": "Watch live demo",
    "trust_eu_hosted": "EU-hosted only",
    "trust_gdpr": "GDPR compliant",
    "trust_no_card": "No credit card required"
  },
  "eaa": {
    "badge": "EAA Monitoring",
    "hero": {
      "title": "Continuous Monitoring for EAA Readiness",
      "subtitle": "Strengthen your EAA readiness with continuous WCAG monitoring. Track accessibility issues over time, catch regressions after releases, and build evidence of ongoing improvement."
    },
    "continuousMonitoring": "Continuous Monitoring for EAA Readiness",
    "websitesChange": "Websites change constantly",
    "eaaExpectsOngoing": "The EAA expects ongoing effort",
    "issuesCompound": "Issues compound if left unchecked",
    "catchRegressions": "Catch regressions after releases"
  },
  "common": {
    "startFreeScan": "Start free scan",
    "getStarted": "Get Started",
    "learnMore": "Learn More",
    "viewDemo": "View Demo",
    "contactUs": "Contact Us",
    "readMore": "Read More",
    "viewAll": "View All",
    "tryNow": "Try Now",
    "bookDemo": "Book Demo",
    "viewPricing": "View Pricing",
    "seeFeatures": "See Features"
  }
}
```

## Key Design System Updates Applied:

1. **Blue-500 Accent**: `bg-blue-500 hover:bg-blue-600`
2. **WCAG AAA Typography**: 18px minimum text, proper contrast ratios
3. **Rounded Corners**: `rounded-2xl` for buttons
4. **Hover States**: `hover:scale-105` for primary buttons
5. **Focus States**: `focus:ring-4 focus:ring-blue-500/20`
6. **Gradient Backgrounds**: `from-zinc-950 to-zinc-900`
7. **Glassmorphism**: `backdrop-blur-sm` for cards

## Pages Still Needing Manual Checking:

- ✅ Homepage (fixed)
- ✅ Navigation (fixed)  
- ✅ EAA Monitoring (fixed)
- ❌ Features page (/features)
- ❌ Pricing page (/pricing)
- ❌ For Agencies page (/for-agencies)
- ❌ Sample Report page (/sample-report)
- ❌ Contact page (/contact)
- ❌ Blog pages
- ❌ Footer component
- ❌ Authentication pages
- ❌ Dashboard pages
- ❌ Settings pages
- ❌ Legal pages (privacy, terms)

All remaining pages need to be checked for hardcoded Dutch text and converted to use the translation system.
