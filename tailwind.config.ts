import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          0: 'var(--bg-0)',
          1: 'var(--bg-1)',
          2: 'var(--bg-2)',
          3: 'var(--bg-3)',
          4: 'var(--bg-4)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          muted: 'var(--muted)',
        },
        line: {
          DEFAULT: 'var(--line)',
          2: 'var(--line-2)',
          3: 'var(--line-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
          soft: 'var(--accent-soft)',
        },
        sel: 'var(--sel)',
        canvas: 'var(--canvas)',
        paper: 'var(--paper)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '11': ['11px', '14px'],
        '12': ['12px', '16px'],
      },
      borderRadius: {
        '3': '3px',
        '5': '5px',
      },
      boxShadow: {
        panel: '0 10px 40px rgba(0,0,0,0.5)',
        paper: '0 2px 20px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config;
