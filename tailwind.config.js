/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
        estado: {
          no_habilitada: {
            bg: '#f1f5f9',
            border: '#cbd5e1',
            text: '#64748b',
            darkBg: '#1e293b',
            darkBorder: '#334155',
            darkText: '#94a3b8'
          },
          disponible: {
            bg: '#f0fdf4',
            border: '#86efac',
            text: '#166534',
            darkBg: '#052e16',
            darkBorder: '#166534',
            darkText: '#4ade80'
          },
          asignada: {
            bg: '#fefce8',
            border: '#fde047',
            text: '#854d0e',
            darkBg: '#422006',
            darkBorder: '#ca8a04',
            darkText: '#facc15'
          },
          reservada: {
            bg: '#fef2f2',
            border: '#fca5a5',
            text: '#991b1b',
            darkBg: '#450a0a',
            darkBorder: '#b91c1c',
            darkText: '#f87171'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-highlight': 'flashHighlight 2.5s ease-out',
      },
      keyframes: {
        flashHighlight: {
          '0%': { transform: 'scale(1.02)', boxShadow: '0 0 0 4px rgba(234, 179, 8, 0.6)' },
          '50%': { transform: 'scale(1.01)', boxShadow: '0 0 0 2px rgba(234, 179, 8, 0.3)' },
          '100%': { transform: 'scale(1)', boxShadow: 'none' }
        }
      }
    },
  },
  plugins: [],
}
