# Using the Vexnexa Design System

This guide explains how to implement the Vexnexa design system across different projects and frameworks.

## Files Overview

- **`design-system.md`** - Human-readable documentation with all design tokens and usage guidelines
- **`design-tokens.json`** - Structured JSON file for programmatic use
- **`design-system.css`** - Ready-to-use CSS file with variables and utility classes

## Quick Start

### Option 1: Direct CSS Import

The simplest way to use the design system is to import the CSS file directly:

```html
<link rel="stylesheet" href="design-system.css">
```

Then use the CSS variables and utility classes:

```html
<div style="background: var(--color-primary); padding: var(--spacing-18);">
  <h1 class="text-display-xl">Hello World</h1>
  <p style="color: var(--color-primary-foreground);">Welcome to Vexnexa</p>
</div>
```

### Option 2: Tailwind CSS Integration

If you're using Tailwind CSS, copy the color definitions from `tailwind.config.ts`:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#B4A7D6",
          foreground: "#4A4458",
          50: "#FAF9FC",
          100: "#F3F0FA",
          // ... rest of the colors
        },
        // ... other color palettes
      }
    }
  }
}
```

### Option 3: CSS-in-JS / JavaScript Frameworks

Import the JSON file into your JavaScript/TypeScript project:

```javascript
import designTokens from './design-tokens.json';

// React example
const Button = styled.button`
  background-color: ${designTokens.colors.primary.DEFAULT};
  color: ${designTokens.colors.primary.foreground};
  box-shadow: ${designTokens.boxShadow['soft-md']};
  border-radius: ${designTokens.borderRadius.default};
  font-family: ${designTokens.typography.fontFamily.display.join(', ')};
`;

// Vue example with inline styles
<template>
  <div :style="{
    backgroundColor: designTokens.colors.primary.DEFAULT,
    padding: designTokens.spacing['18']
  }">
    Content
  </div>
</template>

// Vanilla JS
const element = document.createElement('div');
element.style.backgroundColor = designTokens.colors.primary.DEFAULT;
element.style.boxShadow = designTokens.boxShadow['soft-md'];
```

### Option 4: SCSS/Sass Variables

Convert the CSS variables to SCSS variables:

```scss
// _design-tokens.scss
$color-primary: #B4A7D6;
$color-primary-foreground: #4A4458;
$color-coral: #FFB3D9;
$color-cyan: #A8E6CF;
$color-sunny: #FFDAA8;

$shadow-soft-md: 0 4px 16px rgba(180, 167, 214, 0.18);
$gradient-mesh: linear-gradient(135deg, #B4A7D6 0%, #FFB3D9 50%, #A8E6CF 100%);

// Usage
.button {
  background: $color-primary;
  box-shadow: $shadow-soft-md;
}
```

## Common Use Cases

### 1. Creating Buttons

```html
<!-- Using CSS variables -->
<button style="
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: 1rem 2rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft-md);
  font-family: var(--font-display);
">
  Click Me
</button>

<!-- Using Tailwind (after integration) -->
<button class="bg-primary text-primary-foreground px-8 py-4 rounded-lg shadow-soft-md font-display">
  Click Me
</button>
```

### 2. Creating Cards

```html
<div class="bg-gradient-soft" style="
  padding: var(--spacing-18);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft-lg);
">
  <h2 class="text-display-sm" style="color: var(--color-primary);">Card Title</h2>
  <p style="font-family: var(--font-body); line-height: var(--line-height-relaxed);">
    Card content goes here
  </p>
</div>
```

### 3. Animated Elements

```html
<div class="animate-float" style="
  width: 200px;
  height: 200px;
  background: var(--gradient-mesh);
  border-radius: 50%;
  box-shadow: var(--shadow-glow-purple);
">
  Floating Element
</div>
```

### 4. Hero Sections

```html
<section class="bg-gradient-radial" style="padding: var(--spacing-128) var(--spacing-18);">
  <h1 class="text-display-xl animate-fade-up" style="
    color: var(--color-primary);
    text-align: center;
  ">
    Welcome to Our Platform
  </h1>
</section>
```

## Framework-Specific Implementation

### React + Styled Components

```javascript
import styled from 'styled-components';
import tokens from './design-tokens.json';

export const Button = styled.button`
  background: ${tokens.colors.primary.DEFAULT};
  color: ${tokens.colors.primary.foreground};
  padding: 1rem 2rem;
  border-radius: ${tokens.borderRadius.default};
  box-shadow: ${tokens.boxShadow['soft-md']};
  font-family: ${tokens.typography.fontFamily.display.join(', ')};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: ${tokens.boxShadow['glow-purple']};
    transform: translateY(-2px);
  }
`;

export const Card = styled.div`
  background: ${tokens.colors.primary['50']};
  padding: ${tokens.spacing['18']};
  border-radius: ${tokens.borderRadius.default};
  box-shadow: ${tokens.boxShadow['soft-lg']};
`;
```

### Vue 3 Composition API

```vue
<script setup>
import tokens from './design-tokens.json';

const styles = {
  button: {
    backgroundColor: tokens.colors.primary.DEFAULT,
    color: tokens.colors.primary.foreground,
    padding: '1rem 2rem',
    borderRadius: tokens.borderRadius.default,
    boxShadow: tokens.boxShadow['soft-md'],
    fontFamily: tokens.typography.fontFamily.display.join(', ')
  }
};
</script>

<template>
  <button :style="styles.button">Click Me</button>
</template>
```

### Angular with CSS Variables

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="container" [style.backgroundColor]="'var(--color-primary-50)'">
      <h1 class="text-display-lg">Angular App</h1>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Component logic
}

// In angular.json, add to styles array:
// "src/design-system.css"
```

### Next.js / App Router

```javascript
// app/layout.js
import './design-system.css';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// Usage in components
export default function Hero() {
  return (
    <div className="bg-gradient-radial" style={{ padding: 'var(--spacing-128) var(--spacing-18)' }}>
      <h1 className="text-display-xl animate-fade-up">Welcome</h1>
    </div>
  );
}
```

## Customization

### Overriding Colors

To customize colors while maintaining the system:

```css
:root {
  /* Override specific colors */
  --color-primary: #YOUR_COLOR;
  --color-primary-500: #YOUR_COLOR;

  /* Keep other tokens the same */
}
```

### Adding Custom Colors

```css
:root {
  /* Add your custom colors */
  --color-brand: #123456;
  --color-brand-light: #234567;

  /* Use alongside existing design tokens */
}
```

## Best Practices

1. **Use CSS Variables**: They allow runtime theme changes and easier maintenance
2. **Consistent Spacing**: Use the defined spacing scale (--spacing-18, --spacing-88, etc.)
3. **Typography Hierarchy**: Apply display classes to headings, body font to paragraphs
4. **Color Combinations**: Test color combinations for accessibility (WCAG AA minimum)
5. **Animation Performance**: Use transform and opacity for animations when possible
6. **Responsive Design**: Combine with responsive utility classes or media queries

## Color Accessibility

All color combinations have been tested for contrast. Recommended pairings:

- ✅ Primary on White backgrounds
- ✅ Primary Foreground on Primary backgrounds
- ✅ White text on Primary 600-900
- ✅ Dark text (primary-900) on Primary 50-200

## Support

For questions or issues with the design system, refer to `design-system.md` for detailed documentation.

## Version

Current Version: 1.0.0 (Pastel Color Update)
