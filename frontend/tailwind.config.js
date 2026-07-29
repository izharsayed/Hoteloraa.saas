/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0B1F3A',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C054',
          pale: '#FAF7EE',
        },
        cream: '#FEFBF7',
        charcoal: '#1F2933',
        slate: '#6B7280',
        success: {
          DEFAULT: '#1E9E6A',
          pale: '#EAF8F2',
        },
        danger: {
          DEFAULT: '#D94A4A',
          pale: '#FDF2F2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          pale: '#FEF7E6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          linen: '#F4EFE6',
        },
        border: {
          cream: '#EBE5DA',
        }
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.8rem',   { lineHeight: '1.15rem' }],
        'xs':  ['0.9rem',   { lineHeight: '1.35rem' }],
        'sm':  ['1rem',     { lineHeight: '1.5rem' }],
        'base':['1.1rem',   { lineHeight: '1.7rem' }],
        'lg':  ['1.25rem',  { lineHeight: '1.9rem' }],
        'xl':  ['1.4rem',   { lineHeight: '2rem' }],
        '2xl': ['1.65rem',  { lineHeight: '2.15rem' }],
        '3xl': ['2.1rem',   { lineHeight: '2.5rem' }],
        '4xl': ['2.6rem',   { lineHeight: '3rem' }],
      },
      keyframes: {
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out forwards',
        fadeIn:  'fadeIn 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}

