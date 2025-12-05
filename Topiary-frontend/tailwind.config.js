/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#00FF94', // Neon Green
                secondary: '#2D9CDB', // Electric Blue
                alert: '#EB5757', // Red
                warning: '#F2994A', // Orange
                dark: {
                    bg: '#121212',
                    card: '#1E1E1E',
                    border: '#333333',
                    grid: '#2C2C2C'
                },
                text: {
                    main: '#E0E0E0',
                    muted: '#BDBDBD'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
            },
            animation: {
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
            }
        },
    },
    plugins: [],
}
