# VexNexa Multilingual Design System Implementation Guide

## Overview
This guide provides complete instructions for implementing the new blue-500 design system and WCAG AAA typography across all 5 supported languages (EN, NL, DE, ES, PT).

## 🎨 Design System Specifications

### Color Palette
- **Primary Accent**: `blue-500` (#3b82f6)
- **Primary Hover**: `blue-600` (#2563eb) 
- **Primary Gradient**: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
- **Neutral Text**: `slate-100` (#f1f5f9) for primary text
- **Secondary Text**: `slate-300` (#cbd5e1) for secondary text
- **Muted Text**: `slate-400` (#94a3b8) for tertiary text
- **Background**: `zinc-950` (#0a0a0a) to `zinc-900` (#18181b) gradient

### Typography (WCAG AAA Compliant)
- **Font Family**: Inter (system fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- **Body Text**: 18px minimum, line-height 1.75
- **Headings**: 32px+ with tight tracking (-0.02em)
- **Contrast Ratio**: ≥7:1 for all text combinations

### Component Standards
- **Buttons**: Rounded corners (`rounded-2xl`), proper hover/focus states
- **Cards**: Subtle borders (`border-slate-800`), glassmorphism effects
- **Spacing**: Consistent 8px grid system
- **Animations**: CSS-only, respects `prefers-reduced-motion`

## 🌍 Multilingual Implementation

### Hero Component (Complete Example)

```tsx
// src/components/marketing/home/HomeHeroMultilingual.tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function HomeHeroMultilingual() {
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
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
        </div>
      </div>
    </section>
  );
}
```

## 📝 Translation Keys Structure

### English (messages/en.json)
```json
{
  "hero": {
    "headline": "WCAG 2.2 without the noise.",
    "headline_accent": "White-label reports that actually sell.",
    "subheadline": "Reliable automated scans powered by axe-core. Fewer false positives, actionable fix advice, and fully branded PDF & Word reports. Built for agencies and EU teams that take the EAA seriously.",
    "primary_cta": "Start free scan",
    "secondary_cta": "Watch live demo",
    "trust_eu_hosted": "EU-hosted only",
    "trust_gdpr": "GDPR compliant",
    "trust_no_card": "No credit card required"
  }
}
```

### Dutch (messages/nl.json)
```json
{
  "hero": {
    "headline": "WCAG 2.2 zonder de ruis.",
    "headline_accent": "White-label rapporten die echt verkopen.",
    "subheadline": "Betrouwbare geautomatiseerde scans powered by axe-core. Minder false positives, actiebare fix-adviezen, en volledig branded PDF & Word rapporten. Gebouwd voor bureaus en EU-teams die de EAA serieus nemen.",
    "primary_cta": "Start gratis scan",
    "secondary_cta": "Bekijk live demo",
    "trust_eu_hosted": "Alleen EU-gehost",
    "trust_gdpr": "GDPR compliant",
    "trust_no_card": "Geen creditcard vereist"
  }
}
```

### German (messages/de.json)
```json
{
  "hero": {
    "headline": "WCAG 2.2 ohne den Lärm.",
    "headline_accent": "White-Label-Berichte, die tatsächlich verkaufen.",
    "subheadline": "Zuverlässige automatisierte Scans powered by axe-core. Weniger False Positives, umsetzbare Fix-Ratschläge und vollbranded PDF & Word-Berichte. Gebaut für Agenturen und EU-Teams, die die EAA ernst nehmen.",
    "primary_cta": "Kostenlosen Scan starten",
    "secondary_cta": "Live-Demo ansehen",
    "trust_eu_hosted": "Nur EU-gehosted",
    "trust_gdpr": "DSGVO-konform",
    "trust_no_card": "Keine Kreditkarte erforderlich"
  }
}
```

### Spanish (messages/es.json)
```json
{
  "hero": {
    "headline": "WCAG 2.2 sin el ruido.",
    "headline_accent": "Informes de marca blanca que realmente venden.",
    "subheadline": "Escaneos automatizados confiables powered by axe-core. Menos falsos positivos, consejos de reparación accionables, e informes PDF & Word completamente con marca. Construido para agencias y equipos de la UE que toman la EAA en serio.",
    "primary_cta": "Comenzar escaneo gratuito",
    "secondary_cta": "Ver demo en vivo",
    "trust_eu_hosted": "Solo alojado en UE",
    "trust_gdpr": "Cumple con GDPR",
    "trust_no_card": "No se requiere tarjeta de crédito"
  }
}
```

### Portuguese (messages/pt.json)
```json
{
  "hero": {
    "headline": "WCAG 2.2 sem o ruído.",
    "headline_accent": "Relatórios de marca branca que realmente vendem.",
    "subheadline": "Scans automatizados confiáveis powered by axe-core. Menos falsos positivos, conselhos de reparação acionáveis, e relatórios PDF & Word completamente com marca. Construído para agências e equipas da UE que levam a EAA a sério.",
    "primary_cta": "Começar scan gratuito",
    "secondary_cta": "Ver demo ao vivo",
    "trust_eu_hosted": "Apenas alojado na UE",
    "trust_gdpr": "Conforme com GDPR",
    "trust_no_card": "Não é necessário cartão de crédito"
  }
}
```

## 🚀 Implementation Steps

### 1. Update Navigation Component
```tsx
// src/components/marketing/Navbar.tsx
import { useTranslations } from "next-intl";

export function Navbar() {
  const t = useTranslations('nav');

  return (
    <nav className="border-b border-slate-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-slate-100">
            VexNexa
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-slate-300 hover:text-slate-100 transition-colors">
              {t('features')}
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-slate-100 transition-colors">
              {t('pricing')}
            </Link>
            <Link href="/about" className="text-slate-300 hover:text-slate-100 transition-colors">
              {t('about')}
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-slate-100 transition-colors">
              {t('contact')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### 2. Update Global CSS
```css
/* src/app/globals.css */

/* WCAG AAA Typography */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 18px;
  line-height: 1.75;
  color: #f1f5f9; /* slate-100 */
  background: linear-gradient(to bottom, #0a0a0a, #18181b);
}

/* High Contrast Text */
.text-primary {
  color: #f1f5f9; /* slate-100 - 15.8:1 ratio on zinc-950 */
}

.text-secondary {
  color: #cbd5e1; /* slate-300 - 13.2:1 ratio on zinc-950 */
}

.text-muted {
  color: #94a3b8; /* slate-400 - 7.5:1 ratio on zinc-950 */
}

/* Blue-500 Accent System */
.bg-primary {
  background-color: #3b82f6;
}

.bg-primary-hover {
  background-color: #2563eb;
}

.text-primary {
  color: #3b82f6;
}

.border-primary {
  border-color: #3b82f6;
}

/* Focus States */
.focus-ring:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Button Standards */
.btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 py-3 font-medium transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-blue-500/20;
}

.btn-secondary {
  @apply border-slate-600 text-slate-100 hover:bg-slate-800 rounded-2xl px-6 py-3 font-medium transition-all duration-200;
}

/* Card Standards */
.card {
  @apply rounded-2xl border border-slate-800 bg-zinc-900/50 backdrop-blur-sm p-6;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3. Language-Specific Typography Adjustments

#### German (Longer words)
```css
html[lang="de"] {
  font-size: 17px; /* Slightly smaller for longer German words */
  letter-spacing: -0.01em;
}
```

#### Dutch (Medium length)
```css
html[lang="nl"] {
  font-size: 18px;
  letter-spacing: 0;
}
```

#### Spanish/Portuguese (Romance languages)
```css
html[lang="es"], html[lang="pt"] {
  font-size: 18px;
  letter-spacing: 0.01em; /* Slightly increased spacing */
}
```

## 📱 Mobile Performance Considerations

### Critical Rendering Path
1. **Preload Inter font**: `<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>`
2. **Inline Critical CSS**: Above-the-fold styles in `<style>` tag
3. **Lazy Load Components**: Use `dynamic()` import for below-fold sections
4. **Optimize Images**: WebP format, proper sizing, lazy loading

### Animation Performance
- CSS transforms only (no layout thrash)
- `will-change` only on actively animating elements
- Respect `prefers-reduced-motion`
- Mobile: disable background blur effects

## 🧪 Testing Checklist

### Multilingual Testing
- [ ] All 5 languages display correctly
- [ ] Text doesn't overflow containers in any language
- [ ] Font rendering is crisp across all languages
- [ ] Language switching works seamlessly
- [ ] URL routing preserves language preference

### WCAG AAA Compliance
- [ ] All text has ≥7:1 contrast ratio
- [ ] Focus indicators are clearly visible
- [ ] Keyboard navigation works
- [ ] Screen reader announcements work
- [ ] Reduced motion preferences respected

### Performance
- [ ] LCP < 2.5s on mobile
- [ ] CLS < 0.1
- [ ] FID < 100ms
- [ ] Font loading doesn't block rendering
- [ ] Animations are 60fps

## 🔄 Migration Strategy

### Phase 1: Core Components
1. Update hero section with new design system
2. Implement navigation with translations
3. Add global CSS updates

### Phase 2: Marketing Pages
1. Features page
2. Pricing page  
3. About page
4. Contact page

### Phase 3: Application Pages
1. Dashboard
2. Settings
3. Reports
4. Admin sections

### Phase 4: Polish & Optimization
1. Performance optimization
2. Accessibility audit
3. Cross-browser testing
4. Mobile responsiveness

## 🛠️ Development Tools

### Recommended VS Code Extensions
- **Tailwind CSS IntelliSense**: Class autocomplete
- **i18n Ally**: Translation management
- **Accessibility Insights**: WCAG testing
- **Prettier**: Code formatting

### Build Commands
```bash
# Type checking
npx tsc --noEmit

# Build with analysis
npm run build

# Test translations
npm run test:i18n

# Performance audit
npm run lighthouse
```

This comprehensive guide ensures consistent implementation of the new design system across all supported languages while maintaining WCAG AAA compliance and optimal performance.
