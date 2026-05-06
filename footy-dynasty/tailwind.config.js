/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        abg: 'var(--A-bg)',
        abg2: 'var(--A-bg-2)',
        apanel: 'var(--A-panel)',
        'apanel-2': 'var(--A-panel-2)',
        aline: 'var(--A-line)',
        'aline-2': 'var(--A-line-2)',
        atext: 'var(--A-text)',
        'atext-dim': 'var(--A-text-dim)',
        'atext-mute': 'var(--A-text-mute)',
        aaccent: 'var(--A-accent)',
        'aaccent-2': 'var(--A-accent-2)',
        apos: 'var(--A-pos)',
        aneg: 'var(--A-neg)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Oswald', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
