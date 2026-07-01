/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:         'var(--color-brand)',
        'brand-light': 'var(--color-brand-light)',
        'brand-tint':  'var(--color-brand-tint)',
        ink:           'var(--color-ink)',
        secondary:     'var(--color-secondary)',
        snow:          'var(--color-snow)',
        grid:          'var(--color-grid)',
        bdr:           'var(--color-border)',
        card:          'var(--color-card)',
        pass:          'var(--color-pass)',
        fail:          'var(--color-fail)',
        warn:          'var(--color-warn)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", "'Helvetica Neue'", 'Arial', 'sans-serif'],
        mono: ["'SF Mono'", "'Fira Code'", "'Cascadia Code'", 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        full: '999px',
      },
      fontSize: {
        label: ['11px', { letterSpacing: '0.08em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
