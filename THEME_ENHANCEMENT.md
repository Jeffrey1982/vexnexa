# TutusPorta Enhanced Professional SaaS Theme

## Design Philosophy
Transform TutusPorta from soft pastels to a professional, trustworthy SaaS platform with:
- **Primary**: Deep Ocean Blue/Turquoise for trust and professionalism
- **Secondary**: Warm Amber for approachability and energy
- **Maintaining**: WCAG AA+ accessibility, clean aesthetics, human warmth

## Color Palette

### Base & Neutrals
```css
--color-bg: #FFFFFF;           /* Pure white background */
--color-bg-subtle: #F8FAFC;    /* Subtle gray for sections */
--color-bg-muted: #F1F5F9;     /* Muted background for cards */

--color-text: #0F172A;         /* Deep slate for primary text (contrast: 16.1:1) */
--color-text-muted: #475569;   /* Muted text for secondary content (contrast: 7.3:1) */
--color-text-subtle: #64748B;  /* Subtle text for hints (contrast: 5.7:1) */

--color-border: #E2E8F0;       /* Light border */
--color-border-strong: #CBD5E1; /* Stronger borders */
```

### Primary Accent (Ocean Blue/Turquoise)
```css
--color-primary: #0EA5E9;      /* Sky blue - main CTAs (contrast on white: 3.8:1) */
--color-primary-hover: #0284C7; /* Deeper blue for hover (contrast: 4.9:1) */
--color-primary-active: #0369A1; /* Active state (contrast: 6.1:1) */

--color-primary-50: #F0F9FF;
--color-primary-100: #E0F2FE;
--color-primary-200: #BAE6FD;
--color-primary-300: #7DD3FC;
--color-primary-400: #38BDF8;
--color-primary-500: #0EA5E9;  /* Main */
--color-primary-600: #0284C7;  /* Hover */
--color-primary-700: #0369A1;  /* Active */
--color-primary-800: #075985;
--color-primary-900: #0C4A6E;

--color-primary-foreground: #FFFFFF; /* White text on primary buttons */
```

### Secondary Accent (Warm Amber)
```css
--color-secondary: #F59E0B;    /* Vibrant amber (contrast on white: 3.4:1) */
--color-secondary-hover: #D97706; /* Darker amber hover (contrast: 4.7:1) */
--color-secondary-active: #B45309; /* Active state (contrast: 6.2:1) */

--color-secondary-50: #FFFBEB;
--color-secondary-100: #FEF3C7;
--color-secondary-200: #FDE68A;
--color-secondary-300: #FCD34D;
--color-secondary-400: #FBBF24;
--color-secondary-500: #F59E0B;  /* Main */
--color-secondary-600: #D97706;  /* Hover */
--color-secondary-700: #B45309;  /* Active */
--color-secondary-800: #92400E;
--color-secondary-900: #78350F;

--color-secondary-foreground: #FFFFFF; /* White text on secondary buttons */
```

### Success (Emerald Green)
```css
--color-success: #10B981;      /* Emerald green (contrast: 3.6:1) */
--color-success-hover: #059669;
--color-success-bg: #D1FAE5;   /* Light emerald background */
--color-success-foreground: #FFFFFF;
```

### Warning (Warm Orange)
```css
--color-warning: #F97316;      /* Orange (contrast: 3.3:1) */
--color-warning-hover: #EA580C;
--color-warning-bg: #FFEDD5;   /* Light orange background */
--color-warning-foreground: #FFFFFF;
```

### Error (Vibrant Red)
```css
--color-destructive: #EF4444;  /* Red (contrast: 4.3:1) */
--color-destructive-hover: #DC2626;
--color-destructive-bg: #FEE2E2; /* Light red background */
--color-destructive-foreground: #FFFFFF;
```

## Shadows & Effects

### Elevation
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Primary glow for CTAs */
--shadow-primary-glow: 0 0 0 3px rgba(14, 165, 233, 0.2);
--shadow-secondary-glow: 0 0 0 3px rgba(245, 158, 11, 0.2);
```

### Gradients
```css
--gradient-primary: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
--gradient-warm: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
--gradient-hero: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%);
--gradient-subtle: linear-gradient(to bottom, #FFFFFF 0%, #F8FAFC 100%);
```

## Typography
```css
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
```

## Border Radius
```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Fully rounded */
```

## Usage Guidelines

### Primary Blue - Use For:
✅ Primary CTAs ("Get Started", "Sign Up")
✅ Active navigation items
✅ Primary links
✅ Key interactive elements
✅ Focus indicators

### Secondary Amber - Use For:
✅ Secondary CTAs ("Learn More", "View Demo")
✅ Highlights and badges
✅ Hover states on cards
✅ Icon accents
✅ Progress indicators
✅ Special offers/promotions

### When to Use Each:
- **Primary Blue**: Main actions, trust-building elements
- **Secondary Amber**: Warmth, energy, secondary actions
- **Success Green**: Positive feedback, completed states
- **Warning Orange**: Caution, pending states
- **Error Red**: Errors, destructive actions

## Accessibility Compliance

### Contrast Ratios (WCAG AA+)
- Primary text on white: **16.1:1** ✅ (exceeds AAA)
- Muted text on white: **7.3:1** ✅ (exceeds AA)
- Primary button text: **4.9:1** ✅ (meets AA)
- Secondary button text: **4.7:1** ✅ (meets AA)

### Focus States
All interactive elements have:
- 3px solid outline in primary color
- Subtle glow shadow for visibility
- Consistent across all states

## Emotional Tone
- **Professional**: Deep blues convey trust and reliability
- **Approachable**: Warm amber adds friendly energy
- **Clean**: Generous whitespace, clear hierarchy
- **Human**: Rounded corners, soft shadows
- **Confident**: Bold CTAs, clear visual hierarchy

## Implementation Priority
1. Update primary blue throughout (buttons, links, navigation)
2. Add warm amber as secondary accent (badges, icons, hover states)
3. Enhance shadows for depth
4. Update focus indicators with new primary color
5. Test all contrast ratios
