import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#09090B',
        primary: '#18181B',
        secondary: '#3F3F46',
        accent: '#EC4899',
        paper: '#FAFAFA',
        blush: '#FCE7F3',
        stone: '#E7E5E4',
      },
      fontFamily: {
        heading: ['var(--font-newsreader)'],
        body: ['var(--font-roboto)'],
      },
      boxShadow: {
        editorial: '0 20px 25px rgba(9, 9, 11, 0.08)',
      },
      backgroundImage: {
        'editorial-grid':
          'linear-gradient(to right, rgba(9, 9, 11, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(9, 9, 11, 0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}

export default config
