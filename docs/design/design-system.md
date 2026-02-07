# Vexnexa Design System

A comprehensive design system featuring soft pastel colors, elegant typography, and smooth animations.

## Color Palette

### Primary - Soft Pastel Lavender
Main brand color for connections and primary actions.

- **Default**: `#B4A7D6`
- **Foreground**: `#4A4458`
- **50**: `#FAF9FC`
- **100**: `#F3F0FA`
- **200**: `#E8E3F4`
- **300**: `#D5CCEA`
- **400**: `#C4B8E0`
- **500**: `#B4A7D6`
- **600**: `#9B8CC7`
- **700**: `#8272B5`
- **800**: `#6B5C98`
- **900**: `#544978`

### Coral - Soft Pastel Pink
Warm color for friendliness and approachability.

- **Default**: `#FFB3D9`
- **50**: `#FFF5FB`
- **100**: `#FFEAF6`
- **200**: `#FFD6ED`
- **300**: `#FFC2E4`
- **400**: `#FFADDB`
- **500**: `#FFB3D9`
- **600**: `#FF8DC7`
- **700**: `#FF6BB5`
- **800**: `#E54A95`
- **900**: `#C93D7F`

### Cyan - Soft Pastel Mint/Aqua
Energy and connections color.

- **Default**: `#A8E6CF`
- **50**: `#F0FCF7`
- **100**: `#E0F9F0`
- **200**: `#C7F3E3`
- **300**: `#ADECD6`
- **400**: `#A8E6CF`
- **500**: `#8DE0C1`
- **600**: `#6DD4B0`
- **700**: `#4DC89E`
- **800**: `#3BA982`
- **900**: `#2F8A6B`

### Sunny - Soft Pastel Peach
Happiness and warmth color.

- **Default**: `#FFDAA8`
- **50**: `#FFFCF5`
- **100**: `#FFF8EB`
- **200**: `#FFEDD6`
- **300**: `#FFE3C2`
- **400**: `#FFDAA8`
- **500**: `#FFD08F`
- **600**: `#FFC476`
- **700**: `#FFB75D`
- **800**: `#E59F45`
- **900**: `#CC8933`

## Typography

### Font Families
- **Display**: Space Grotesk, system-ui, sans-serif
- **Body**: Inter, system-ui, sans-serif

### Font Sizes
- **display-xl**: 4.5rem (72px) - Line height 1.1, Letter spacing -0.02em, Weight 700
- **display-lg**: 3.75rem (60px) - Line height 1.1, Letter spacing -0.02em, Weight 700
- **display-md**: 3rem (48px) - Line height 1.15, Letter spacing -0.01em, Weight 700
- **display-sm**: 2.25rem (36px) - Line height 1.2, Letter spacing -0.01em, Weight 600
- **display-xs**: 1.875rem (30px) - Line height 1.3, Letter spacing 0, Weight 600

### Line Height
- **Relaxed**: 1.6

## Box Shadows

### Soft Shadows
- **soft-sm**: `0 2px 8px rgba(180, 167, 214, 0.12)`
- **soft-md**: `0 4px 16px rgba(180, 167, 214, 0.18)`
- **soft-lg**: `0 8px 24px rgba(180, 167, 214, 0.22)`

### Glow Effects
- **glow-purple**: `0 0 30px rgba(180, 167, 214, 0.5)`
- **glow-pink**: `0 0 30px rgba(255, 179, 217, 0.5)`
- **glow-cyan**: `0 0 30px rgba(168, 230, 207, 0.5)`

### Special Effects
- **glass**: `0 8px 32px 0 rgba(180, 167, 214, 0.15)`
- **neon**: `0 0 5px rgba(180, 167, 214, 0.6), 0 0 20px rgba(180, 167, 214, 0.4)`

## Gradients

### Background Gradients
- **gradient-mesh**: `linear-gradient(135deg, #B4A7D6 0%, #FFB3D9 50%, #A8E6CF 100%)`
- **gradient-soft**: `linear-gradient(135deg, #FAF9FC 0%, #FFF5FB 50%, #F0FCF7 100%)`

### Radial Gradient
- **bg-gradient-radial**: `radial-gradient(circle at 50% 0%, rgba(180, 167, 214, 0.15) 0%, rgba(255, 179, 217, 0.08) 50%, transparent 80%)`

### Grid Pattern
- **bg-grid-subtle**:
  ```
  linear-gradient(to right, rgba(180, 167, 214, 0.12) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(180, 167, 214, 0.12) 1px, transparent 1px)
  ```
  Background size: 32px x 32px

## Spacing

Custom spacing values beyond Tailwind defaults:
- **18**: 4.5rem (72px)
- **88**: 22rem (352px)
- **100**: 25rem (400px)
- **112**: 28rem (448px)
- **128**: 32rem (512px)

## Animations

### Animation Names
- **fade-up**: 0.6s ease-out
- **fade-in**: 0.4s ease-out
- **slide-in**: 0.4s ease-out
- **float**: 6s ease-in-out infinite
- **bounce-slow**: 3s ease-in-out infinite
- **wiggle**: 1s ease-in-out infinite
- **pulse-slow**: 3s cubic-bezier(0.4, 0, 0.6, 1) infinite
- **spin-slow**: 8s linear infinite
- **ping-slow**: 2s cubic-bezier(0, 0, 0.2, 1) infinite
- **gradient**: 8s ease infinite
- **blob**: 7s infinite
- **tilt**: 10s infinite linear

### Keyframes

#### fadeUp
```css
0%: { opacity: 0, transform: translateY(20px) }
100%: { opacity: 1, transform: translateY(0) }
```

#### fadeIn
```css
0%: { opacity: 0 }
100%: { opacity: 1 }
```

#### slideIn
```css
0%: { transform: translateX(-100%) }
100%: { transform: translateX(0) }
```

#### float
```css
0%, 100%: { transform: translateY(0) }
50%: { transform: translateY(-20px) }
```

#### wiggle
```css
0%, 100%: { transform: rotate(-3deg) }
50%: { transform: rotate(3deg) }
```

#### gradient
```css
0%, 100%: { backgroundPosition: 0% 50% }
50%: { backgroundPosition: 100% 50% }
```

#### blob
```css
0%: { transform: translate(0px, 0px) scale(1) }
33%: { transform: translate(30px, -50px) scale(1.1) }
66%: { transform: translate(-20px, 20px) scale(0.9) }
100%: { transform: translate(0px, 0px) scale(1) }
```

#### tilt
```css
0%, 50%, 100%: { transform: rotate(0deg) }
25%: { transform: rotate(1deg) }
75%: { transform: rotate(-1deg) }
```

## Border Radius
- **Default radius**: 0.5rem (8px)

## Backdrop Blur
- **xs**: 2px

## Usage Guidelines

### Color Combinations
- **Primary on Light**: Use `primary-DEFAULT (#B4A7D6)` on white backgrounds
- **Text on Primary**: Use `primary-foreground (#4A4458)` on primary backgrounds
- **Accent Colors**: Combine coral, cyan, and sunny for vibrant accents
- **Subtle Backgrounds**: Use 50-100 shades for soft backgrounds

### Typography Hierarchy
1. Use `display-xl` or `display-lg` for hero sections
2. Use `display-md` for main page headings
3. Use `display-sm` for section headings
4. Use `display-xs` for card headings
5. Apply `font-display` to all headings, `font-body` to body text

### Animation Best Practices
- Use `fade-up` for entrance animations
- Apply `float` or `blob` to decorative elements
- Use `pulse-slow` for attention-grabbing elements
- Reserve `wiggle` for interactive hover states

### Shadow Hierarchy
- **Small elements**: Use `soft-sm`
- **Cards/Medium elements**: Use `soft-md`
- **Modals/Large elements**: Use `soft-lg`
- **Hover states**: Add glow effects for emphasis
- **Glass morphism**: Use `glass` shadow
