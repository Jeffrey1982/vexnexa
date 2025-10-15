# VexNexa Marketing Site

A modern, trust-first marketing website built with Next.js 14, TypeScript, TailwindCSS, and Framer Motion. Designed to help SMEs and agencies modernize their digital presence with a focus on performance, accessibility, and conversion.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **Animation:** Framer Motion
- **Forms:** React Hook Form + Zod validation
- **Email:** Resend
- **Content:** MDX (for blog and legal pages)
- **Deployment:** Vercel (recommended)

## 🎨 Brand Tokens

The VexNexa brand identity is defined in `tailwind.config.ts`:

### Colors

```js
primary: "#FF6A00"           // VexNexa orange
charcoal: "#17181B"          // Main text color
charcoal-dark: "#0F0F12"     // Darker backgrounds
steel: "#BFC6D0"             // Accent/borders
offwhite: "#F7F8FA"          // Light backgrounds
```

### Typography

- **Display Font:** Space Grotesk (headings, hero text)
- **Body Font:** Inter (paragraphs, UI)

Configured in `lib/fonts.ts`. Update font imports there if you want to switch typefaces.

### Spacing & Layout

- Container max-width: `1280px` (7xl)
- Section padding: `py-16 md:py-24 lg:py-32`
- Card elevation: `shadow-soft-sm`, `shadow-soft-md`, `shadow-soft-lg`

## 🗂️ Project Structure

```
/app
  /about              # About page
  /api/contact        # Contact form API route
  /blog               # Blog listing + posts
  /cases              # Case studies
  /contact            # Contact page with form
  /legal              # Terms & Privacy pages
  /pricing            # Pricing page with comparison table
  /services           # Service packs page
  /solutions          # Solutions overview page
  layout.tsx          # Root layout with Header/Footer
  page.tsx            # Homepage
  sitemap.ts          # Dynamic sitemap
  robots.ts           # Dynamic robots.txt

/components
  /forms              # ContactForm
  /layout             # Header, Footer, Section
  /pricing            # PricingTable, ComparisonTable
  /shared             # LogoCloud, FeatureList, Metrics, Testimonial
  /ui                 # shadcn/ui primitives (Button, Card, etc.)

/lib
  /data               # Fixture data (logos, testimonials, pricing, etc.)
  fonts.ts            # Font configuration
  utils.ts            # Utilities (cn, formatDate, slugify)

/content              # MDX content for blog, legal pages (future)

/public
  /logos              # Client logos (replace placeholders)
  /images             # General images
  robots.txt          # Static robots.txt (fallback)
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Resend API Key (for contact form emails)
RESEND_API_KEY=your_resend_api_key_here

# Email Configuration
CONTACT_EMAIL_TO=hello@vexnexa.com
CONTACT_EMAIL_FROM=noreply@vexnexa.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

# Site URL (for SEO and sitemap)
NEXT_PUBLIC_SITE_URL=https://vexnexa.com
```

**Get a Resend API key:** [https://resend.com](https://resend.com)

## 🎯 Key Features

### 1. Accessible & Performant
- WCAG 2.1 AA compliant components
- Keyboard navigation support
- Focus management
- Skip-to-content link
- Semantic HTML landmarks
- Target: Lighthouse scores ≥90 Performance, 100 Accessibility

### 2. Conversion-Optimized
- Clear CTAs throughout
- Social proof (testimonials, logos, metrics)
- Transparent pricing
- Easy contact forms with validation
- Fast page loads

### 3. SEO-Ready
- Dynamic sitemap (`/sitemap.xml`)
- Robots.txt configuration
- OpenGraph & Twitter Card metadata
- Semantic HTML structure
- Performance optimization

### 4. Developer-Friendly
- TypeScript for type safety
- Component-driven architecture
- Reusable primitives (shadcn/ui)
- Clear fixture data structure
- Easy to customize

## ✏️ Customization Guide

### Change Colors

Edit `tailwind.config.ts`:

```ts
colors: {
  primary: {
    DEFAULT: "#FF6A00",  // Change to your brand color
    // ...
  },
  // ...
}
```

### Change Typography

Edit `lib/fonts.ts` to use different fonts:

```ts
import { YourFont } from 'next/font/google'

export const yourFont = YourFont({
  subsets: ['latin'],
  variable: '--font-your-font',
  display: 'swap',
})
```

Then update `tailwind.config.ts`:

```ts
fontFamily: {
  display: ['var(--font-your-font)', 'system-ui', 'sans-serif'],
  // ...
}
```

### Update Pricing Plans

Edit `lib/data/fixture-data.ts`:

```ts
export const pricingPlans = [
  {
    name: "Your Plan Name",
    price: { monthly: "€999", quarterly: "€2500" },
    features: ["Feature 1", "Feature 2"],
    // ...
  },
  // ...
]
```

Pricing will automatically update everywhere it's used.

### Add Client Logos

1. Add logo files to `/public/logos/`
2. Update `lib/data/fixture-data.ts`:

```ts
export const logos = [
  { name: "Client Name", src: "/logos/client-logo.svg" },
  // ...
]
```

### Customize Copy

Most copy is inline in page components. Key files:

- **Homepage:** `app/page.tsx`
- **Solutions:** `app/solutions/page.tsx`
- **Pricing:** `app/pricing/page.tsx`
- **About:** `app/about/page.tsx`

For global copy (like taglines), search for strings and replace.

### Add Blog Posts

Blog posts use placeholder content. To add MDX support:

1. Install MDX dependencies (already in package.json)
2. Create MDX files in `/content/blog/`
3. Use `next-mdx-remote` to render content
4. Update `app/blog/page.tsx` to fetch real posts

Example MDX structure:

```mdx
---
title: "Your Post Title"
date: "2024-01-15"
excerpt: "Short description"
tags: ["Tag1", "Tag2"]
---

# Your Post Title

Content here...
```

## 📧 Contact Form Setup

The contact form uses Resend for email delivery.

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env`:

```env
RESEND_API_KEY=re_your_key_here
CONTACT_EMAIL_TO=hello@vexnexa.com
CONTACT_EMAIL_FROM=noreply@vexnexa.com
```

4. Verify your sending domain in Resend dashboard

The form submits to `/api/contact` and validates with Zod. Customize the email template in `app/api/contact/route.ts`.

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### Accessibility Testing

1. Install axe DevTools browser extension
2. Run automated scans on each page
3. Test keyboard navigation (Tab, Enter, Escape)
4. Test with screen reader (NVDA, VoiceOver)

### Performance Testing

1. Run Lighthouse in Chrome DevTools
2. Test on real devices (mobile, tablet)
3. Check Core Web Vitals
4. Target: ≥90 Performance, 100 Accessibility, ≥95 Best Practices, ≥95 SEO

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Or use Vercel CLI
vercel --prod
```

### Other Platforms

Works on any platform that supports Next.js 14:
- Netlify
- Railway
- DigitalOcean App Platform
- Self-hosted with Docker

Build command: `npm run build`
Start command: `npm start`
Output directory: `.next`

## 📊 Analytics

### Google Analytics

Add your GA4 ID to `.env`:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Then add the GA script to `app/layout.tsx`.

### Plausible (Privacy-Friendly Alternative)

Add your domain to `.env`:

```env
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=vexnexa.com
```

Add Plausible script to `app/layout.tsx`.

## 🎨 Component Usage

### Button

```tsx
import { Button } from "@/components/ui/button"

<Button variant="primary" size="lg">
  Click me
</Button>
```

Variants: `primary`, `secondary`, `ghost`, `link`, `outline`

### Card

```tsx
import { Card } from "@/components/ui/card"

<Card elevation="md" padding="lg">
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

### Section

```tsx
import { Section } from "@/components/layout/Section"

<Section background="gradient" className="py-24">
  <div className="max-w-4xl mx-auto">
    {/* Content */}
  </div>
</Section>
```

Backgrounds: `default`, `white`, `gradient`, `grid`

### Metrics

```tsx
import { Metrics } from "@/components/shared/Metrics"

<Metrics
  metrics={[
    { value: "+38%", label: "conversions", highlighted: true },
    { value: "-60%", label: "manual work" },
  ]}
  layout="chips"
/>
```

## 🐛 Troubleshooting

### Build Errors

**Error: Can't resolve '@/components/...'**

Check `tsconfig.json` has correct path aliases:

```json
"paths": {
  "@/*": ["./*"]
}
```

**Error: Missing environment variables**

Ensure `.env` file exists and contains required variables.

### Contact Form Not Sending

1. Check Resend API key is correct
2. Verify sending domain in Resend dashboard
3. Check browser console for errors
4. Test API route directly: `POST /api/contact`

### Styling Issues

1. Run `npm install` to ensure TailwindCSS is installed
2. Check `globals.css` is imported in `app/layout.tsx`
3. Restart dev server (`npm run dev`)

## 📝 License

Proprietary. All rights reserved to VexNexa.

## 🤝 Support

Questions? Contact us at hello@vexnexa.com

---

Built with ❤️ by VexNexa
