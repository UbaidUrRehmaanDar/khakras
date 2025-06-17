/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'chakra': {
          'primary': '#ff6b9d',
          'secondary': '#c44569',
          'accent': '#ff6b9d',
          'dark': '#1a0f1a',
          'darker': '#2d1b3d',
          'purple': '#4a1a4a',
          'pink': '#c44569',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'audio-wave': 'audio-wave 1s ease-in-out infinite alternate',
      }
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/forms")],
  daisyui: {
    themes: [
      {
        chakra: {
          "primary": "#ff6b9d",
          "secondary": "#c44569",
          "accent": "#ff6b9d",
          "neutral": "#2d1b3d",
          "base-100": "#1a0f1a",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
}