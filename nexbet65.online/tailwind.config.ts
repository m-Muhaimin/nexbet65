import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '1rem',
  		screens: {
  			'2xl': '1600px'
  		}
  	},
  	extend: {
   		fontFamily: {
   			sans: [
   				'var(--font-inter)',
   				'var(--font-bengali)',
   				'system-ui',
   				'-apple-system',
   				'sans-serif'
   			],
   			unbounded: [
   				'var(--font-unbounded)',
   				'sans-serif'
   			],
   			'plus-jakarta': [
   				'var(--font-plus-jakarta)',
   				'sans-serif'
   			]
   		},
colors: {
    			brand: {
    				DEFAULT: '#f6b01a',
    				dim: '#c9a43c'
    			},
    			'royal-gold': '#C89B3C',
    			emerald: {
    				DEFAULT: '#19C6A3',
    				dim: '#127a68',
    			},
    			bg: '#0a1526',
   			surface: '#132036',
   			surface2: '#1a2a44',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  			'pulse-glow': {
  				'0%, 100%': {
  					opacity: '0.6'
  				},
  				'50%': {
  					opacity: '1'
  				}
  			},
  			'hub-pulse': {
  				'0%, 100%': {
  					transform: 'scale(1)',
  					boxShadow: '0 0 18px rgba(251,191,36,0.45)'
  				},
  				'50%': {
  					transform: 'scale(1.08)',
  					boxShadow: '0 0 36px rgba(251,191,36,0.8)'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-8px)'
  				}
  			},
  			shimmer: {
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			marquee: {
  				to: {
  					transform: 'translateX(-50%)'
  				}
  			},
  			'win-in': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(-8px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'none'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'hub-pulse': 'hub-pulse 1.6s ease-in-out infinite',
  			float: 'float 6s ease-in-out infinite',
  			shimmer: 'shimmer 1.5s infinite',
  			marquee: 'marquee 32s linear infinite',
  			'win-in': 'win-in 0.45s ease'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
