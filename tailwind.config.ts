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
  		fontFamily: {
  			sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
  			display: ['var(--font-spacegrotesk)', 'Space Grotesk', 'sans-serif'],
  			inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
  			body: ['var(--font-inter)', 'Inter', 'sans-serif'],
  			jakarta: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
  			dmsans: ['var(--font-dmsans)', 'DM Sans', 'sans-serif'],
  			spacegrotesk: ['var(--font-spacegrotesk)', 'Space Grotesk', 'sans-serif'],
  			urbanist: ['var(--font-urbanist)', 'Urbanist', 'sans-serif']
  		},
  		colors: {
  			background: 'hsl(var(--background))',
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
  				50: '#F0F9FF',
  				100: '#E0F2FE',
  				200: '#BAE6FD',
  				300: '#7DD3FC',
  				400: '#38BDF8',
  				500: '#0EA5E9',
  				600: '#0284C7',
  				700: '#0369A1',
  				800: '#075985',
  				900: '#0C4A6E'
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
  			amber: {
  				DEFAULT: '#F59E0B',
  				50: '#FFFBEB',
  				100: '#FEF3C7',
  				200: '#FDE68A',
  				300: '#FCD34D',
  				400: '#FBBF24',
  				500: '#F59E0B',
  				600: '#D97706',
  				700: '#B45309',
  				800: '#92400E',
  				900: '#78350F'
  			},
  			emerald: {
  				DEFAULT: '#10B981',
  				50: '#ECFDF5',
  				100: '#D1FAE5',
  				200: '#A7F3D0',
  				300: '#6EE7B7',
  				400: '#34D399',
  				500: '#10B981',
  				600: '#059669',
  				700: '#047857',
  				800: '#065F46',
  				900: '#064E3B'
  			},
  			orange: {
  				DEFAULT: '#F97316',
  				50: '#FFF7ED',
  				100: '#FFEDD5',
  				200: '#FED7AA',
  				300: '#FDBA74',
  				400: '#FB923C',
  				500: '#F97316',
  				600: '#EA580C',
  				700: '#C2410C',
  				800: '#9A3412',
  				900: '#7C2D12'
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
  			tp: {
  				bg: 'var(--tp-bg)',
  				surface: 'var(--tp-surface)',
  				muted: 'var(--tp-muted)',
  				border: 'var(--tp-border)',
  				text: 'var(--tp-text)',
  				'text-muted': 'var(--tp-text-muted)',
  				primary: 'var(--tp-primary)',
  				'primary-hover': 'var(--tp-primary-hover)',
  				accent: 'var(--tp-accent)'
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
  			'glow-blue': '0 0 30px rgba(14, 165, 233, 0.5)',
  			'glow-amber': '0 0 30px rgba(245, 158, 11, 0.5)',
  			'glow-emerald': '0 0 30px rgba(16, 185, 129, 0.5)',
  			'glass': '0 8px 32px 0 rgba(14, 165, 233, 0.12)',
  			'neon': '0 0 5px rgba(14, 165, 233, 0.6), 0 0 20px rgba(14, 165, 233, 0.4)'
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
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.4s ease-out',
  			'fade-up': 'fade-up 0.6s ease-out',
  			'slide-up': 'slide-up 0.6s ease-out',
  			'slide-in': 'slide-in 0.4s ease-out',
  			'scale-in': 'scale-in 0.4s ease-out',
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