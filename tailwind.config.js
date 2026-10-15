/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primario: '#1d4ed8',
        'primario-oscuro': '#1e40af',
        'primario-suave': '#eff4ff',
        secundario: '#047857',
        'secundario-suave': '#ecfdf5',
        peligro: '#dc2626',
        'peligro-suave': '#fef2f2',
        aviso: '#b45309',
        'aviso-suave': '#fffbeb',
        fondo: '#f4f6f9',
        superficie: '#ffffff',
        borde: '#e3e8ef',
        texto: '#0f172a',
        'texto-suave': '#64748b',
      },
      fontFamily: {
        // Fuente incluida en la app (src/assets/fonts): se ve igual con o sin internet
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        // Los números usan la misma letra, con cifras de ancho fijo (ver index.css)
        mono: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        tarjeta: '0 1px 2px rgba(15, 23, 42, 0.06)',
        panel: '0 8px 24px -12px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
}
