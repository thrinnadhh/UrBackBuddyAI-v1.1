/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#09090b', // Zinc 950
                surface: '#18181b',    // Zinc 900
                primary: '#10b981',    // Emerald 500
                secondary: '#71717a',  // Zinc 500
                glassBorder: 'rgba(255, 255, 255, 0.08)',
            },
        },
    },
    plugins: [],
}
