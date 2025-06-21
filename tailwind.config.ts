import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        barbershop: {
          primary: "#8B4513",
          secondary: "#D2691E",
          accent: "#CD853F",
          dark: "#2D1810",
          light: "#F5E6D3"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            primary: {
              50: "#F5E6D3",
              100: "#E8D1B8",
              200: "#D1A371",
              300: "#BA752A",
              400: "#A35A1A",
              500: "#8B4513",
              600: "#7A3D11",
              700: "#69350F",
              800: "#582D0D",
              900: "#47250B",
              DEFAULT: "#8B4513",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#FDF2E9",
              100: "#FBE4D3",
              200: "#F7C9A7",
              300: "#F3AE7B",
              400: "#EF934F",
              500: "#D2691E",
              600: "#C55F1A",
              700: "#B85516",
              800: "#AB4B12",
              900: "#9E410E",
              DEFAULT: "#D2691E",
              foreground: "#FFFFFF",
            },
            focus: "#8B4513",
          },
        },
        dark: {
          colors: {
            primary: {
              50: "#2D1810",
              100: "#3D2218",
              200: "#4D2C20",
              300: "#5D3628",
              400: "#6D4030",
              500: "#CD853F",
              600: "#D69A54",
              700: "#DFAF69",
              800: "#E8C47E",
              900: "#F1D993",
              DEFAULT: "#CD853F",
              foreground: "#000000",
            },
            secondary: {
              50: "#2D1810",
              100: "#3D2218",
              200: "#4D2C20",
              300: "#5D3628",
              400: "#6D4030",
              500: "#F4A460",
              600: "#F5B575",
              700: "#F6C68A",
              800: "#F7D79F",
              900: "#F8E8B4",
              DEFAULT: "#F4A460",
              foreground: "#000000",
            },
            focus: "#CD853F",
          },
        },
      },
    }),
  ],
};

export default config;
