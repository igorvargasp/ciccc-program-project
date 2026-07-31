import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
      },
      colors: {
        app: 'rgb(var(--bg-app) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--bg-surface) / <alpha-value>)',
          2: 'rgb(var(--bg-surface-2) / <alpha-value>)',
        },
        foreground: 'rgb(var(--fg-primary) / <alpha-value>)',
        muted: 'rgb(var(--fg-muted) / <alpha-value>)',
        edge: 'rgb(var(--edge) / <alpha-value>)',
        brand: {
          DEFAULT: '#00d2fd',
          hover: '#00b8dd',
        },
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'live-dot': 'pulse2 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
