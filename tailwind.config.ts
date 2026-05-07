import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
	extend: {
		/* Semantic surfaces: background / muted / card — driven by globals.css :root & .dark */
		fontFamily: {
			sans: ['var(--font-outfit)', '"Outfit"', 'system-ui', 'sans-serif'],
			display: ['"Zodiak"', 'Georgia', '"Times New Roman"', 'serif'],
			body: ['var(--font-outfit)', '"Outfit"', 'system-ui', 'sans-serif'],
			inter: ['var(--font-outfit)', '"Outfit"', 'system-ui', 'sans-serif'],
			jakarta: ['var(--font-outfit)', '"Outfit"', 'system-ui', 'sans-serif'],
			dmsans: ['var(--font-outfit)', '"Outfit"', 'system-ui', 'sans-serif'],
			spacegrotesk: ['"Zodiak"', 'Georgia', '"Times New Roman"', 'serif'],
			urbanist: ['var(--font-outfit)', '"Outfit"', 'system-ui', 'sans-serif']
		},
		colors: {
			background: 'hsl(var(--background))',
			surface: 'hsl(var(--surface))',
			foreground: 'hsl(var(--foreground))',
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))',
				50: '#FFF8F0',
				100: '#FCECD8',
				200: '#F4D4B0',
				300: '#E8B480',
				400: '#D4956B',
				500: '#C8793F',
				600: '#A0522D',
				700: '#8B4513',
				800: '#6B3410',
				900: '#4A2408'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			success: {
				DEFAULT: 'hsl(var(--success))',
				foreground: 'hsl(var(--success-foreground))'
			},
			warning: {
				DEFAULT: 'hsl(var(--warning))',
				foreground: 'hsl(var(--warning-foreground))'
			},
			critical: {
				DEFAULT: 'hsl(var(--critical))',
				foreground: 'hsl(var(--critical-foreground))'
			},
			serious: {
				DEFAULT: 'hsl(var(--serious))',
				foreground: 'hsl(var(--serious-foreground))'
			},
			moderate: {
				DEFAULT: 'hsl(var(--moderate))',
				foreground: 'hsl(var(--moderate-foreground))'
			},
			minor: {
				DEFAULT: 'hsl(var(--minor))',
				foreground: 'hsl(var(--minor-foreground))'
			},
			gold: {
				DEFAULT: '#A0522D',
				50: '#FFF8F0',
				100: '#FCECD8',
				200: '#F4D4B0',
				300: '#E8B480',
				400: '#D4956B',
				500: '#C8793F',
				600: '#A0522D',
				700: '#8B4513',
				800: '#6B3410',
				900: '#4A2408'
			},
			blue: {
				DEFAULT: '#A0522D',
				50: '#FFF8F0',
				100: '#FCECD8',
				200: '#F4D4B0',
				300: '#E8B480',
				400: '#D4956B',
				500: '#C8793F',
				600: '#A0522D',
				700: '#8B4513',
				800: '#6B3410',
				900: '#4A2408'
			},
			brand: {
				sienna: '#A0522D',
				sand: '#D2B48C'
			},
			graphite: {
				DEFAULT: '#2A1E10',
				50: '#FEFCF6',
				100: '#FAF4E8',
				200: '#EDE0CC',
				300: '#D4C4A8',
				400: '#8A7E70',
				500: '#2A1E10',
				600: '#1A1610',
				700: '#141210',
				800: '#0b0a08',
				900: '#060504'
			},
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			},
			vn: {
				bg: 'var(--vn-bg)', // Midnight Graphite
				surface: 'var(--vn-surface)', // Cloud White
				muted: 'var(--vn-muted)',
				border: 'var(--vn-border)', // Ash Gray
				text: 'var(--vn-text)',
				'text-muted': 'var(--vn-text-muted)',
				primary: 'var(--vn-primary)',
				'primary-hover': 'var(--vn-primary-hover)',
				accent: 'var(--vn-accent)',
				teal: 'var(--vn-teal)' // Teal Blue
			}
		},
		boxShadow: {
			'elev1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
			'elev2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
			'elev3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
			'elev4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
			'soft-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
			'soft-md': '0 4px 16px rgba(0, 0, 0, 0.12)',
			'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.15)',
			'glow-orange': '0 0 30px rgba(160, 82, 45, 0.35)',
			'glow-gold': '0 0 30px rgba(160, 82, 45, 0.35)',
			'glow-teal': '0 0 30px rgba(160, 82, 45, 0.45)',
			'glass': '0 8px 32px 0 rgba(42, 30, 16, 0.08)',
			'neon': '0 0 5px rgba(160, 82, 45, 0.45), 0 0 20px rgba(160, 82, 45, 0.25)'
		},
		spacing: {
			'18': '4.5rem',
			'88': '22rem',
			'100': '25rem',
			'112': '28rem',
			'128': '32rem'
		},
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)',
			xl: '0.875rem',
			'2xl': '1rem'
		},
		keyframes: {
			'accordion-down': {
				from: {
					height: '0'
				},
				to: {
					height: 'var(--radix-accordion-content-height)'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: '0'
				}
			},
			'fade-in': {
				from: {
					opacity: '0'
				},
				to: {
					opacity: '1'
				}
			},
			'fade-up': {
				from: {
					opacity: '0',
					transform: 'translateY(20px)'
				},
				to: {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			'slide-up': {
				from: {
					opacity: '0',
					transform: 'translateY(20px)'
				},
				to: {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			'slide-in': {
				from: {
					transform: 'translateX(-100%)'
				},
				to: {
					transform: 'translateX(0)'
				}
			},
			'scale-in': {
				from: {
					opacity: '0',
					transform: 'scale(0.95)'
				},
				to: {
					opacity: '1',
					transform: 'scale(1)'
				}
			},
			'float': {
				'0%, 100%': {
					transform: 'translateY(0)'
				},
				'50%': {
					transform: 'translateY(-20px)'
				}
			},
			'wiggle': {
				'0%, 100%': {
					transform: 'rotate(-3deg)'
				},
				'50%': {
					transform: 'rotate(3deg)'
				}
			},
			'gradient': {
				'0%, 100%': {
					backgroundPosition: '0% 50%'
				},
				'50%': {
					backgroundPosition: '100% 50%'
				}
			},
			'blob': {
				'0%': {
					transform: 'translate(0px, 0px) scale(1)'
				},
				'33%': {
					transform: 'translate(30px, -50px) scale(1.1)'
				},
				'66%': {
					transform: 'translate(-20px, 20px) scale(0.9)'
				},
				'100%': {
					transform: 'translate(0px, 0px) scale(1)'
				}
			},
			'tilt': {
				'0%, 50%, 100%': {
					transform: 'rotate(0deg)'
				},
				'25%': {
					transform: 'rotate(1deg)'
				},
				'75%': {
					transform: 'rotate(-1deg)'
				}
			},
			'shimmer': {
				'0%': {
					transform: 'translateX(-100%)'
				},
				'100%': {
					transform: 'translateX(100%)'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
			'accordion-up': 'accordion-up 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
			'fade-in': 'fade-in 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
			'fade-up': 'fade-up 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
			'slide-up': 'slide-up 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
			'slide-in': 'slide-in 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
			'scale-in': 'scale-in 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
			'float': 'float 6s ease-in-out infinite',
			'wiggle': 'wiggle 1s ease-in-out infinite',
			'gradient': 'gradient 8s ease infinite',
			'blob': 'blob 7s infinite',
			'tilt': 'tilt 10s infinite linear',
			'shimmer': 'shimmer 2s linear infinite'
		}
	}
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
