/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        app: "var(--app-fontFamily)",
      },
      textColor: () => ({
        app: {
          DEFAULT: "var(--app-textColor)",
          wordmark: "var(--app-wordmark-textColor)",
          link: {
            DEFAULT: "var(--app-link-textColor)",
            hover: "var(--app-link-hover-textColor)",
          },
          panel: {
            header: "var(--app-panel-header-textColor)",
            body: "var(--app-panel-body-textColor)",
          },
          button: {
            primary: {
              DEFAULT: "var(--app-button-primary-textColor)",
              hover: "var(--app-button-primary-hover-textColor)",
              disabled: "var(--app-button-primary-disabled-textColor)",
              active: "var(--app-button-primary-active-textColor)",
            },
            secondary: {
              DEFAULT: "var(--app-button-secondary-textColor)",
              hover: "var(--app-button-secondary-hover-textColor)",
              disabled: "var(--app-button-secondary-disabled-textColor)",
              active: "var(--app-button-secondary-active-textColor)",
            },
            tertiary: {
              DEFAULT: "var(--app-button-tertiary-textColor)",
              hover: "var(--app-button-tertiary-hover-textColor)",
              disabled: "var(--app-button-tertiary-disabled-textColor)",
              active: "var(--app-button-tertiary-active-textColor)",
            },
          },
          accordion: {
            header: "var(--app-accordion-header-textColor)",
            body: "var(--app-accordion-body-textColor)",
          },
        },
      }),

      backgroundColor: () => ({
        app: {
          DEFAULT: "var(--app-backgroundColor)",
          appHeader: "var(--app-appHeader-backgroundColor)",
          accordion: {
            header: "var(--app-accordion-header-backgroundColor)",
            body: "var(--app-accordion-body-backgroundColor)",
          },
          objectViewer: "var(--app-objectViewer-backgroundColor)",
          panel: {
            header: "var(--app-panel-header-backgroundColor)",
            body: "var(--app-panel-body-backgroundColor)",
          },
          button: {
            primary: {
              DEFAULT: "var(--app-button-primary-backgroundColor)",
              hover: "var(--app-button-primary-hover-backgroundColor)",
              disabled: "var(--app-button-primary-disabled-backgroundColor)",
              active: "var(--app-button-primary-active-backgroundColor)",
            },
            secondary: {
              DEFAULT: "var(--app-button-secondary-backgroundColor)",
              hover: "var(--app-button-secondary-hover-backgroundColor)",
              disabled: "var(--app-button-secondary-disabled-backgroundColor)",
              active: "var(--app-button-secondary-active-backgroundColor)",
            },
            tertiary: {
              DEFAULT: "var(--app-button-tertiary-backgroundColor)",
              hover: "var(--app-button-tertiary-hover-backgroundColor)",
              disabled: "var(--app-button-tertiary-disabled-backgroundColor)",
              active: "var(--app-button-tertiary-active-backgroundColor)",
            },
          },
        },
      }),
      borderWidth: () => ({
        app: "var(--app-borderWidth)",
        "app-button-borderWidth": "var(--app-button-borderWidth)",
      }),
      borderColor: () => ({
        app: {
          DEFAULT: "var(--app-borderColor)",
          panel: "var(--app-panel-borderColor)",
          "panel-header-bottom": "var(--app-panel-header-bottom-borderColor)",
          accordion: {
            outer: "var(--app-accordion-outer-borderColor)",
            inner: "var(--app-accordion-inner-borderColor)",
          },
          button: {
            primary: {
              DEFAULT: "var(--app-button-primary-borderColor)",
              hover: "var(--app-button-primary-hover-borderColor)",
              disabled: "var(--app-button-primary-disabled-borderColor)",
              active: "var(--app-button-primary-active-borderColor)",
            },
            secondary: {
              DEFAULT: "var(--app-button-secondary-borderColor)",
              hover: "var(--app-button-secondary-hover-borderColor)",
              disabled: "var(--app-button-secondary-disabled-borderColor)",
              active: "var(--app-button-secondary-active-borderColor)",
            },
            tertiary: {
              DEFAULT: "var(--app-button-tertiary-borderColor)",
              hover: "var(--app-button-tertiary-hover-borderColor)",
              disabled: "var(--app-button-tertiary-disabled-borderColor)",
              active: "var(--app-button-tertiary-active-borderColor)",
            },
          },
        },
      }),
      gap: () => ({
        // nesting doesn't seem to work here
        // so we hyphenate to give a similar name schema
        // to other props
        "app-panel-items": "var(--app-panel-items-gap)",
        "app-widgetList": "var(--app-widgetList-gap)",
      }),
      spacing: {
        "app-panel-body-margin": "var(--app-panel-items-gap)",
        xs: "20rem" /* 320px */,
        sm: "24rem" /* 384px */,
        md: "28rem" /* 448px */,
        lg: "32rem" /* 512px */,
        xl: "36rem" /* 576px */,
        "2xl": "42rem" /* 672px */,
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
  ],
};
