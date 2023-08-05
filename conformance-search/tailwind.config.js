import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        screens: {
            xs: "400px",
            ...defaultTheme.screens
        },
        extend: {
            colors: {
                paper: "#f5f5f5"
            },
            borderWidth: {
                1: "1px"
            }
        }
    },
    plugins: [
        ({ addVariant }) => {
            addVariant("child", "& > *");
            addVariant("child-hover", "& > *:hover");
        }
    ]
};
