/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                color1: "#D0294B",
                color2: "#D02985",
                color3: "#D32C60",
                color4: "#F7F2F2",
                color5: "#FFE2E2",
            },
        },
    },
    plugins: [],
}
