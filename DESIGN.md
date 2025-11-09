# VexNexa Design System

## Overview

VexNexa uses a modern, accessible design system built with:
- **Typography**: Premium font pairing with Plus Jakarta Sans + Inter
- **Brand Tokens**: Consistent color palette with CSS custom properties
- **Glass Morphism**: Modern UI effects with backdrop-blur
- **Elevation System**: 4-level shadow hierarchy
- **Accessibility**: AA+ WCAG compliance with focus-visible states

---

## Typography System

### Font Pairing

We use a dual-font system optimized for readability and visual hierarchy:

- **Headings**: Plus Jakarta Sans (700/600 weight)
- **Body Text**: Inter (400/500/600 weight)

### Available Fonts

All fonts are loaded via `next/font/google` with optimal performance:

```typescript
// Primary pairing (default)
import { inter, jakarta } from '@/app/fonts'

// Alternative options
import { dmSans, spaceGrotesk, urbanist } from '@/app/fonts'
```

### Font Presets

Use predefined font combinations for easy A/B testing:

```typescript
import { fontPresets } from '@/app/fonts'

// Available presets:
fontPresets.jakartaInter      // Plus Jakarta Sans + Inter (default)
fontPresets.dmSansInter        // DM Sans + Inter
fontPresets.spaceGroteskInter  // Space Grotesk + Inter
fontPresets.urbanistInter      // Urbanist + Inter
fontPresets.interOnly          // Inter only
```

### Switching Typography Pairing

To change the typography pairing across the entire app:

1. **Update `src/app/layout.tsx`:**
   ```tsx
   import { inter, dmSans } from './fonts' // Change jakarta to dmSans

   <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
   ```

2. **Update `tailwind.config.ts`:**
   ```typescript
   fontFamily: {
     sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
     display: ['var(--font-dmsans)', 'DM Sans', 'sans-serif'], // Change jakarta to dmsans
   }
   ```

3. **No changes needed in components** - they automatically use the new fonts!

### Typography Classes

Tailwind classes for font families:

```css
font-sans         /* Inter (body text) */
font-display      /* Plus Jakarta Sans (headings) */
font-inter        /* Explicit Inter */
font-jakarta      /* Explicit Plus Jakarta Sans */
font-dmsans       /* DM Sans */
font-spacegrotesk /* Space Grotesk */
font-urbanist     /* Urbanist */
```

---

## Brand Tokens

### Color System

All colors use CSS custom properties for easy theming:

```css
:root {
  /* Core Colors */
  --tp-bg: #0B1220;           /* Dark background */
  --tp-surface: #FFFFFF;      /* White surfaces */
  --tp-muted: #F5F7FB;        /* Subtle backgrounds */
  --tp-border: #E5E7EB;       /* Borders */

  /* Text Colors */
  --tp-text: #0B1220;         /* Primary text (AA contrast) */
  --tp-text-muted: #475569;   /* Secondary text (AA contrast) */

  /* Brand Colors */
  --tp-primary: #2563EB;      /* Primary blue */
  --tp-primary-hover: #1D4ED8; /* Primary hover state */
  --tp-accent: #14B8A6;       /* Accent teal */
}
```

### Using Brand Tokens

In Tailwind classes:

```jsx
<div className="bg-[var(--tp-muted)]">
<h1 className="text-[var(--tp-text)]">
<button className="bg-[var(--tp-primary)] hover:bg-[var(--tp-primary-hover)]">
```

Or use the `tp-*` Tailwind utilities:

```jsx
<div className="bg-tp-muted">
<h1 className="text-tp-text">
<button className="bg-tp-primary hover:bg-tp-primary-hover">
```

### Elevation System

4-level shadow hierarchy for depth:

```jsx
<div className="shadow-elev1">  {/* Subtle elevation */}
<div className="shadow-elev2">  {/* Medium elevation */}
<div className="shadow-elev3">  {/* High elevation */}
<div className="shadow-elev4">  {/* Maximum elevation */}
```

Shadow values:
- `elev1`: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- `elev2`: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- `elev3`: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- `elev4`: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

---

## Glass Morphism

### Glass Effect

Add modern glass morphism to any element:

```jsx
<div className="glass">
  {/* Content */}
</div>
```

The `.glass` utility provides:
- Semi-transparent white background (70% opacity)
- 12px backdrop blur with 180% saturation
- Subtle border with transparency
- Soft shadow for depth
- Automatic dark mode support

### Custom Glass Effects

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.dark .glass {
  background: rgba(11, 18, 32, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## Button Variants

### Available Variants

```jsx
import { Button } from '@/components/ui/button'

// Primary button (default)
<Button variant="default">Click me</Button>

// Glassy secondary (navbar style)
<Button variant="secondary">Secondary</Button>

// Gradient CTA
<Button variant="gradient">Start Free</Button>

// Outline
<Button variant="outline">Outline</Button>

// Ghost (minimal)
<Button variant="ghost">Ghost</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Link
<Button variant="link">Link</Button>
```

### Button Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

---

## Border Radius

Custom border radius tokens:

```css
rounded-xl   /* 0.875rem (14px) */
rounded-2xl  /* 1rem (16px) */
```

Plus standard Tailwind values (sm, md, lg).

---

## Accessibility

### Focus States

All interactive elements have AA+ compliant focus states:

```css
*:focus-visible {
  outline: 2px solid var(--tp-primary);
  outline-offset: 3px;
  border-radius: 4px;
}
```

### Color Contrast

All text colors meet WCAG AA contrast requirements:
- `--tp-text` on `--tp-surface`: 16:1 (AAA)
- `--tp-text-muted` on `--tp-surface`: 7.5:1 (AA)
- `--tp-primary` on white: 4.5:1 (AA)

### Testing

Run Lighthouse accessibility audits on:
- `/` (home page)
- `/features`
- `/pricing`

Target score: ≥95

---

## Implementation Examples

### Page Header

```jsx
<header className="glass sticky top-0 z-50 shadow-elev2">
  <div className="container mx-auto px-6">
    <h1 className="font-display font-bold text-4xl text-tp-text">
      Welcome to VexNexa
    </h1>
    <p className="font-sans text-tp-text-muted">
      Professional accessibility testing
    </p>
  </div>
</header>
```

### CTA Section

```jsx
<section className="bg-tp-muted py-20">
  <div className="container mx-auto text-center">
    <h2 className="font-display font-bold text-3xl mb-4">
      Start Your Free Trial
    </h2>
    <p className="font-sans text-tp-text-muted mb-8">
      Get started in minutes, no credit card required
    </p>
    <Button variant="gradient" size="lg">
      Start Free Trial
    </Button>
  </div>
</section>
```

### Card with Elevation

```jsx
<div className="bg-white rounded-2xl shadow-elev2 hover:shadow-elev3 transition-shadow p-6">
  <h3 className="font-display font-semibold text-xl mb-2">
    Feature Title
  </h3>
  <p className="font-sans text-tp-text-muted">
    Feature description text
  </p>
</div>
```

---

## File Structure

```
src/
├── app/
│   ├── fonts.ts              # Font configurations & presets
│   ├── layout.tsx            # Root layout with font loading
│   └── globals.css           # CSS variables & utilities
├── components/
│   └── ui/
│       └── button.tsx        # Button component with variants
└── tailwind.config.ts        # Tailwind theme extensions
```

---

## Quick Reference

| Element | Font | Weight | Size |
|---------|------|--------|------|
| H1 | Plus Jakarta Sans | 700 | 36-60px |
| H2 | Plus Jakarta Sans | 700 | 30-36px |
| H3 | Plus Jakarta Sans | 600 | 24-30px |
| Body | Inter | 400 | 16px |
| Button | Inter | 500 | 14px |
| Caption | Inter | 400 | 14px |

| Color | Token | Hex | Usage |
|-------|-------|-----|-------|
| Primary | `--tp-primary` | #2563EB | CTAs, links, accents |
| Primary Hover | `--tp-primary-hover` | #1D4ED8 | Button hover states |
| Accent | `--tp-accent` | #14B8A6 | Highlights, success |
| Text | `--tp-text` | #0B1220 | Primary text |
| Text Muted | `--tp-text-muted` | #475569 | Secondary text |
| Background | `--tp-muted` | #F5F7FB | Page backgrounds |
| Surface | `--tp-surface` | #FFFFFF | Cards, panels |
| Border | `--tp-border` | #E5E7EB | Dividers, outlines |

---

## Migration Guide

### From Old to New Design System

1. **Colors**: Replace `bg-primary` with `bg-tp-primary` or `bg-[var(--tp-primary)]`
2. **Shadows**: Replace `shadow-sm/md/lg` with `shadow-elev1/2/3/4`
3. **Buttons**: Update to use new variants (`default`, `secondary`, `gradient`)
4. **Focus states**: Already handled globally, no changes needed
5. **Typography**: Headings automatically use Plus Jakarta Sans, body uses Inter

### Breaking Changes

None - the new system extends the existing Tailwind theme without removing defaults.

---

## Support

For questions or issues with the design system:
- **GitHub Issues**: https://github.com/vexnexa/vexnexa/issues
- **Documentation**: https://vexnexa.com/docs
- **Contact**: support@vexnexa.com
