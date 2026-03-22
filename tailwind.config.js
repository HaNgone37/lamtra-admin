/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4318FF',
        secondary: '#FFFFFF',
        dark: '#1F2937',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      shadows: {
        'premium': '0 20px 60px rgba(67, 24, 255, 0.15)',
      },
      boxShadow: {
        'premium': '0 20px 60px rgba(67, 24, 255, 0.15)',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.5s ease-out',
        'slideInLeft': 'slideInLeft 0.5s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(67, 24, 255, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(67, 24, 255, 0)',
          },
        },
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #4318FF 0%, #7C3AED 100%)',
      },
    },
  },
  plugins: [],
}
