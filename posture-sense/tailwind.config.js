/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    light: '#fafafa', // zinc-50
                    dark: '#020617', // slate-950
                },
                surface: {
                    light: '#ffffff', // white
                    dark: '#0f172a', // slate-900
                },
                primary: {
                    light: '#06b6d4', // cyan-500
                    dark: '#10b981', // emerald-500
                },
            },
        },
    },
    plugins: [],
}
