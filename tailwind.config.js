/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#F5F0E8',
        foreground: '#0A0A0A',
        primary: '#FF3B00',
        secondary: '#1A1AFF',
        accent: '#FFD600',
        success: '#00C851',
        danger: '#FF1744',
        warning: '#FF6D00',
      },
      boxShadow: {
        'neo': '6px 6px 0px #0A0A0A',
        'neo-sm': '4px 4px 0px #0A0A0A',
        'neo-lg': '8px 8px 0px #0A0A0A',
        'neo-primary': '6px 6px 0px #FF3B00',
        'neo-accent': '6px 6px 0px #FFD600',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      borderRadius: {
        'neo': '2px',
      },
    },
  },
  plugins: [],
}
