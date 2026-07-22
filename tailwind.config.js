/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08080c',
          900: '#0b0b12',
          850: '#101019',
          800: '#15151f',
          750: '#1b1b28',
          700: '#232333',
          600: '#2e2e42',
        },
        sol: {
          purple: '#9945FF',
          green: '#14F195',
          teal: '#19FB9B',
          blue: '#00C2FF',
        },
        line: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'sol-gradient': 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
        'sol-gradient-soft': 'linear-gradient(135deg, rgba(153,69,255,0.18) 0%, rgba(20,241,149,0.14) 100%)',
        'grid': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(153,69,255,0.5)',
        'glow-green': '0 0 40px -12px rgba(20,241,149,0.45)',
        card: '0 8px 30px -10px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
