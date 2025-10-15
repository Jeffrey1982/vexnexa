import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FF6A00",
          foreground: "#FFFFFF",
          50: "#FFF4ED",
          100: "#FFE8DB",
          200: "#FFCCB3",
          300: "#FFAD85",
          400: "#FF8A52",
          500: "#FF6A00",
          600: "#E55F00",
          700: "#C24F00",
          800: "#994000",
          900: "#703000",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        charcoal: {
          DEFAULT: "#17181B",
          dark: "#0F0F12",
          light: "#1F2023",
        },
        steel: {
          DEFAULT: "#BFC6D0",
          50: "#F5F6F8",
          100: "#EBEDF1",
          200: "#D7DBE3",
          300: "#BFC6D0",
          400: "#9BA5B5",
          500: "#7D8A9E",
          600: "#646F82",
          700: "#4F5765",
          800: "#3A4149",
          900: "#262B31",
        },
        offwhite: {
          DEFAULT: "#F7F8FA",
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-xs': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
      },
      lineHeight: {
        'relaxed': '1.6',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(15, 15, 18, 0.08)',
        'soft-md': '0 4px 16px rgba(15, 15, 18, 0.12)',
        'soft-lg': '0 8px 24px rgba(15, 15, 18, 0.16)',
        'glow': '0 0 20px rgba(255, 106, 0, 0.3)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
