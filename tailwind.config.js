/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),

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
  ],
};
