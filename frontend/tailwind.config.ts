import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          amber: '#F59E0B',
          warm: '#FBBF24',
          dark: '#1F2937',
          cream: '#FEF3C7',
          egg: '#FFFDF5',
          green: '#10B981',
        },
      },
    },
  },
  plugins: [],
};

export default config;
