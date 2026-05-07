/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Copilot Chat 風のダークパレット
        bg: {
          DEFAULT: '#1f1f1f',
          elev: '#252526',
          input: '#313131',
          chip: '#2a2a2a',
        },
        line: {
          DEFAULT: '#3a3a3a',
          subtle: '#2a2a2a',
        },
        fg: {
          DEFAULT: '#cccccc',
          muted: '#9d9d9d',
          dim: '#6e6e6e',
        },
        accent: {
          DEFAULT: '#4a9eff',
          fg: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
