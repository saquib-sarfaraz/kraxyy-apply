/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F4EFE4',
          dark: '#EAE2D2',
          light: '#FAF7F1',
          50: '#FAF7F1',
          100: '#F4EFE4',
          200: '#EAE2D2',
          300: '#DED3BE'
        },
        olive: {
          DEFAULT: '#525B31',
          light: '#6A7640',
          dark: '#3D4425',
          hover: '#454C29',
          50: '#F2F4EC',
          100: '#E0E5D3',
          500: '#525B31',
          600: '#454C29',
          700: '#383E21',
          800: '#2A2E19',
          900: '#1C1F10'
        },
        mustard: {
          DEFAULT: '#B18B40',
          light: '#C9A354',
          dark: '#8E6F33',
          hover: '#9E7C39',
          50: '#FBF7EE',
          100: '#F5ECDA',
          500: '#B18B40',
          600: '#9E7C39',
          700: '#856830'
        },
        beige: {
          DEFAULT: '#D6CAAC',
          light: '#E5DCB5',
          dark: '#C1B391',
          50: '#F8F6F0',
          100: '#EFEBDD',
          200: '#D6CAAC',
          300: '#C1B391',
          400: '#AFA07C'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          cream: '#F4EFE4',
          beige: '#EBE5D5',
          subtle: '#F7F4EC'
        },
        charcoal: {
          DEFAULT: '#1E2315',
          light: '#363E27',
          muted: '#626B52',
          faint: '#8E987E'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px'
      }
    },
  },
  plugins: [],
}
