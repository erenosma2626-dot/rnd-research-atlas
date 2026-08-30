/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        fg: '#0A0A0A',
        'fg-muted': 'rgba(0,0,0,0.6)',
        'fg-subtle': 'rgba(0,0,0,0.5)',
        'border-subtle': 'rgba(0,0,0,0.06)',
        'border-hover': 'rgba(0,0,0,0.2)',
        'bg-light': '#FFFFFF',
        'bg-dark': '#0A0A0A',
        'surface-light': '#FFFFFF',
        'surface-dark': '#141414',
        'card-bg-light': '#FFFFFF',
        'card-bg-dark': '#141414',
        'card-border-light': 'rgba(0, 0, 0, 0.08)',
        'card-border-dark': 'rgba(255, 255, 255, 0.08)',
        accent: '#0A0A0A',
        'accent-hover': '#262626',
        'text-primary-light': '#0A0A0A',
        'text-primary-dark': '#FFFFFF',
        'text-secondary-light': 'rgba(0, 0, 0, 0.55)',
        'text-secondary-dark': 'rgba(255, 255, 255, 0.55)',
        'border-light': 'rgba(0, 0, 0, 0.08)',
        'border-dark': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 14px 0 rgba(0, 0, 0, 0.06)',
        card: '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.08)',
        subtle: '0 8px 30px rgba(0, 0, 0, 0.06)',
      },
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        apple: '200ms',
      },
    },
  },
  plugins: [],
};
