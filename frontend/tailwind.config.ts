import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Custom Brand Colors - Rumah Plagiasi (Expanded Palette)
        brand: {
          // Primary Green Palette
          primary: '#67C090',      // Main green - for primary actions, active states
          secondary: '#DDF4E7',    // Light green - for backgrounds, hover states

          // Navy & Blue Palette
          navy: {
            DEFAULT: '#26667F',  // Medium navy - for text, borders
            dark: '#124170',     // Dark navy - for headings, important text
          },
          blue: {
            DEFAULT: '#4A90E2',  // Sky blue - for information, links
            light: '#E3F2FD',    // Light blue - for backgrounds, cards
            dark: '#2563EB',     // Deep blue - for buttons, accents
          },

          // Teal & Aqua Palette  
          teal: '#5A827E',        // Teal - for accents, secondary elements
          aqua: {
            DEFAULT: '#5DADE2',  // Aqua - for fresh accents
            light: '#D4F1F4',    // Light aqua - for subtle backgrounds
          },

          // Green Variations
          sage: {
            DEFAULT: '#84AE92',  // Sage green - for success states
            light: '#B9D4AA',    // Light sage - for subtle backgrounds
          },
          lime: '#FAFFCA',        // Light lime - for highlights, warnings

          // Soft Purple & Pink Palette
          purple: {
            DEFAULT: '#9B87C7',  // Soft purple - for premium features
            light: '#F3E5F5',    // Light purple - for backgrounds
          },
          lavender: {
            DEFAULT: '#B8A7D6',  // Lavender - for soft accents
            light: '#E8DEF8',    // Light lavender - for hover states
          },

          // Warm Palette
          coral: {
            DEFAULT: '#FF8A80',  // Soft coral - for alerts, highlights
            light: '#FFEBEE',    // Light coral - for backgrounds
          },
          peach: {
            DEFAULT: '#FFB4AB',  // Peach - for warm accents
            light: '#FFF3E0',    // Light peach - for soft backgrounds
          },

          // Neutral Soft Palette
          cream: '#F5F5DC',       // Cream - for warm backgrounds
          sand: '#F4E4C1',        // Sand - for subtle sections
          sky: '#E0F2F7',         // Sky - for cool backgrounds
          mist: '#F0F4F8',        // Mist - for soft sections
        },
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
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
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
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
