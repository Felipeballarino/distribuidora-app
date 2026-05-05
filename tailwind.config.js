/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primario: '#1a56db',
        secundario: '#057a55',
        peligro: '#e02424',
        fondo: '#f9fafb',
        superficie: '#ffffff',
        texto: '#111827',
        'texto-suave': '#6b7280',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
