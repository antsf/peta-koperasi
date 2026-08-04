import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design director tokens
        bg: '#FAF9F5',
        surface: '#FFFFFF',
        'surface-raised': '#F5F3EE',
        primary: {
          DEFAULT: '#0B6E4F',
          hover: '#085A40',
        },
        secondary: '#D97706',
        accent: '#2563EB',
        danger: '#B91C1C',
        'text-primary': '#1C1917',
        'text-secondary': '#57534E',
        'text-disabled': '#A8A29E',
        border: {
          DEFAULT: '#E7E5E4',
          focus: '#0B6E4F',
        },
        // Status colors
        status: {
          pending: {
            bg: '#FEF9C3',
            text: '#713F12',
            border: '#FDE047',
          },
          approved: {
            bg: '#DCFCE7',
            text: '#14532D',
            border: '#86EFAC',
          },
          flagged: {
            bg: '#FFEDD5',
            text: '#7C2D12',
            border: '#FDBA74',
          },
          removed: {
            bg: '#F5F5F4',
            text: '#78716C',
            border: '#D6D3D1',
          },
        },
      },
      fontFamily: {
        heading: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(28, 25, 23, 0.08), 0 1px 2px rgba(28, 25, 23, 0.06)',
        'card-hover': '0 4px 12px rgba(28, 25, 23, 0.10), 0 2px 4px rgba(28, 25, 23, 0.06)',
        modal: '0 20px 40px rgba(28, 25, 23, 0.15), 0 8px 16px rgba(28, 25, 23, 0.10)',
        popup: '0 4px 16px rgba(28, 25, 23, 0.12)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out-custom': 'cubic-bezier(0.45, 0, 0.55, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '240': '240ms',
        '500': '500ms',
      },
      animation: {
        'count-up': 'countUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pin-drop': 'pinDrop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'skeleton-shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pinDrop: {
          '0%': { opacity: '0', transform: 'scale(0) translateY(-20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
