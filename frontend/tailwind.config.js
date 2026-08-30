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
        'bg-light': '#F5F5F7',
        'bg-dark': '#1D1D1F',
        'surface-light': '#FFFFFF',
        'surface-dark': '#2C2C2E',
        accent: '#0071E3',
        'accent-hover': '#0077ED',
        'text-primary-light': '#1D1D1F',
        'text-primary-dark': '#F5F5F7',
        'text-secondary-light': '#86868B',
        'text-secondary-dark': '#A1A1A6',
        'border-light': '#E5E5EA',
        'border-dark': '#3A3A3C',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        subtle: '0 8px 30px rgba(0, 0, 0, 0.06)',
      },
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        apple: '250ms',
      },
    },
  },
  plugins: [],
};
