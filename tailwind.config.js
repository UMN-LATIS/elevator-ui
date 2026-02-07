/** @type {import('tailwindcss').Config} */

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        "auto-xs": "repeat(auto-fill, minmax(8rem, 1fr))",
        "auto-sm": "repeat(auto-fill, minmax(12rem, 1fr))",
        "auto-md": "repeat(auto-fill, minmax(16rem, 1fr))",
        "auto-lg": "repeat(auto-fill, minmax(20rem, 1fr))",
        "auto-xl": "repeat(auto-fill, minmax(24rem, 1fr))",
      },
      spacing: {
        xs: "20rem",
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
      },
      colors: {
        umn: {
          maroon: "#7a0019",
          "maroon-light": "#900021",
          "maroon-dark": "#5b0013",
          gold: "#ffcc33",
          "gold-light": "#ffde7a",
          "gold-dark": "#ffb71e",
        },
        transparent: {
          DEFAULT: "transparent",
          black: {
            50: "rgba(0, 0, 0, 0.04)",
            100: "rgba(0, 0, 0, 0.06)",
            200: "rgba(0, 0, 0, 0.08)",
            300: "rgba(0, 0, 0, 0.16)",
            400: "rgba(0, 0, 0, 0.24)",
            500: "rgba(0, 0, 0, 0.36)",
            600: "rgba(0, 0, 0, 0.48)",
            700: "rgba(0, 0, 0, 0.64)",
            800: "rgba(0, 0, 0, 0.8)",
            900: "rgba(0, 0, 0, 0.92)",
          },
          white: {
            50: "rgba(255, 255, 255, 0.04)",
            100: "rgba(255, 255, 255, 0.06)",
            200: "rgba(255, 255, 255, 0.08)",
            300: "rgba(255, 255, 255, 0.16)",
            400: "rgba(255, 255, 255, 0.24)",
            500: "rgba(255, 255, 255, 0.36)",
            600: "rgba(255, 255, 255, 0.48)",
            700: "rgba(255, 255, 255, 0.64)",
            800: "rgba(255, 255, 255, 0.8)",
            900: "rgba(255, 255, 255, 0.92)",
          },
        },
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
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Material Design 3 Semantic Tokens
        // These reference CSS custom properties from m3.css
        surface: {
          DEFAULT: "oklch(var(--surface))",
          dim: "oklch(var(--surface-dim))",
          bright: "oklch(var(--surface-bright))",
          container: {
            lowest: "oklch(var(--surface-container-lowest))",
            low: "oklch(var(--surface-container-low))",
            DEFAULT: "oklch(var(--surface-container))",
            high: "oklch(var(--surface-container-high))",
            highest: "oklch(var(--surface-container-highest))",
          },
        },
        "on-surface": {
          DEFAULT: "oklch(var(--on-surface))",
          variant: "oklch(var(--on-surface-variant))",
        },
        "m3-primary": {
          DEFAULT: "oklch(var(--primary))",
          container: "oklch(var(--primary-container))",
        },
        "on-primary": {
          DEFAULT: "oklch(var(--on-primary))",
          container: "oklch(var(--on-primary-container))",
        },
        "m3-secondary": {
          DEFAULT: "oklch(var(--secondary))",
          container: "oklch(var(--secondary-container))",
        },
        "on-secondary": {
          DEFAULT: "oklch(var(--on-secondary))",
          container: "oklch(var(--on-secondary-container))",
        },
        tertiary: {
          DEFAULT: "oklch(var(--tertiary))",
          container: "oklch(var(--tertiary-container))",
        },
        "on-tertiary": {
          DEFAULT: "oklch(var(--on-tertiary))",
          container: "oklch(var(--on-tertiary-container))",
        },
        error: {
          DEFAULT: "oklch(var(--error))",
          container: "oklch(var(--error-container))",
        },
        "on-error": {
          DEFAULT: "oklch(var(--on-error))",
          container: "oklch(var(--on-error-container))",
        },
        success: {
          DEFAULT: "oklch(var(--success))",
          container: "oklch(var(--success-container))",
        },
        "on-success": {
          DEFAULT: "oklch(var(--on-success))",
          container: "oklch(var(--on-success-container))",
        },
        warning: {
          DEFAULT: "oklch(var(--warning))",
          container: "oklch(var(--warning-container))",
        },
        "on-warning": {
          DEFAULT: "oklch(var(--on-warning))",
          container: "oklch(var(--on-warning-container))",
        },
        info: {
          DEFAULT: "oklch(var(--info))",
          container: "oklch(var(--info-container))",
        },
        "on-info": {
          DEFAULT: "oklch(var(--on-info))",
          container: "oklch(var(--on-info-container))",
        },
        outline: {
          DEFAULT: "oklch(var(--outline))",
          variant: "oklch(var(--outline-variant))",
        },
        "inverse-surface": "oklch(var(--inverse-surface))",
        "inverse-on-surface": "oklch(var(--inverse-on-surface))",
        "inverse-primary": "oklch(var(--inverse-primary))",
        scrim: "oklch(var(--scrim))",
        shadow: "oklch(var(--shadow))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  safelist: [
    "sm:grid-cols-1",
    "sm:grid-cols-2",
    "sm:grid-cols-3",
    "md:grid-cols-1",
    "md:grid-cols-2",
    "md:grid-cols-3",
    "not-prose",
  ],
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),

    /**
     * expose tailwind colors as CSS variables
     * like: `--color-blue-200`
     * or default colors as: `--color-blue`
     *
     * @example
     * ```css
     *   a { color: var(--color-blue-600); }
     *   a:hover { color: var(--color-fuchsia); }
     * ```
     *
     * @see https://gist.github.com/Merott/d2a19b32db07565e94f10d13d11a8574
     * @see https://tailwindcss.com/docs/customizing-colors
     */
    function ({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = "") {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];
          const cssVariable =
            colorKey === "DEFAULT"
              ? `--color${colorGroup}`
              : `--color${colorGroup}-${colorKey}`;

          const newVars =
            typeof value === "string"
              ? { [cssVariable]: value }
              : extractColorVars(value, `-${colorKey}`);

          return { ...vars, ...newVars };
        }, {});
      }

      addBase({
        ":root": extractColorVars(theme("colors")),
      });
    },
    require("tailwindcss-animate"),
  ],
};
