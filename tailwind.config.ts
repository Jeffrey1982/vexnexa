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
        // Soft pastel lavender - main brand for connections
        primary: {
          DEFAULT: "#B4A7D6",
          foreground: "#4A4458",
          50: "#FAF9FC",
          100: "#F3F0FA",
          200: "#E8E3F4",
          300: "#D5CCEA",
          400: "#C4B8E0",
          500: "#B4A7D6",
          600: "#9B8CC7",
          700: "#8272B5",
          800: "#6B5C98",
          900: "#544978",
        },
        // Soft pastel pink for friendliness
        coral: {
          DEFAULT: "#FFB3D9",
          50: "#FFF5FB",
          100: "#FFEAF6",
          200: "#FFD6ED",
          300: "#FFC2E4",
          400: "#FFADDB",
          500: "#FFB3D9",
          600: "#FF8DC7",
          700: "#FF6BB5",
          800: "#E54A95",
          900: "#C93D7F",
        },
        // Soft pastel mint/aqua for energy & connections
        cyan: {
          DEFAULT: "#A8E6CF",
          50: "#F0FCF7",
          100: "#E0F9F0",
          200: "#C7F3E3",
          300: "#ADECD6",
          400: "#A8E6CF",
          500: "#8DE0C1",
          600: "#6DD4B0",
          700: "#4DC89E",
          800: "#3BA982",
          900: "#2F8A6B",
        },
        // Soft pastel peach for happiness
        sunny: {
          DEFAULT: "#FFDAA8",
          50: "#FFFCF5",
          100: "#FFF8EB",
          200: "#FFEDD6",
          300: "#FFE3C2",
          400: "#FFDAA8",
          500: "#FFD08F",
          600: "#FFC476",
          700: "#FFB75D",
          800: "#E59F45",
          900: "#CC8933",
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
        'soft-sm': '0 2px 8px rgba(180, 167, 214, 0.12)',
        'soft-md': '0 4px 16px rgba(180, 167, 214, 0.18)',
        'soft-lg': '0 8px 24px rgba(180, 167, 214, 0.22)',
        'glow-purple': '0 0 30px rgba(180, 167, 214, 0.5)',
        'glow-pink': '0 0 30px rgba(255, 179, 217, 0.5)',
        'glow-cyan': '0 0 30px rgba(168, 230, 207, 0.5)',
        'glass': '0 8px 32px 0 rgba(180, 167, 214, 0.15)',
        'neon': '0 0 5px rgba(180, 167, 214, 0.6), 0 0 20px rgba(180, 167, 214, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #B4A7D6 0%, #FFB3D9 50%, #A8E6CF 100%)',
        'gradient-soft': 'linear-gradient(135deg, #FAF9FC 0%, #FFF5FB 50%, #F0FCF7 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'blob': 'blob 7s infinite',
        'tilt': 'tilt 10s infinite linear',
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
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
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
