/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F4EFE4',
          dark: '#EAE2D2',
          light: '#FAF7F1'
        },
        olive: {
          DEFAULT: '#525B31',
          light: '#6A7640',
          dark: '#3D4425',
          hover: '#454C29'
        },
        mustard: {
          DEFAULT: '#B18B40',
          light: '#C9A354',
          dark: '#8E6F33',
          hover: '#9E7C39'
        },
        beige: {
          DEFAULT: '#D6CAAC',
          light: '#E5DCB5',
          dark: '#C1B391'
        },
        charcoal: {
          DEFAULT: '#1E2315',
          light: '#363E27',
          muted: '#626B52'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
