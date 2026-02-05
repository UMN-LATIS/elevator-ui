import { describe, it, expect } from "vitest";
import { resolveThemingConfig } from "./resolveThemingConfig";

describe("resolveThemingConfig", () => {
  describe("availableThemes", () => {
    it("returns provided themes when valid", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "light"],
        enabled: true,
        defaultTheme: "dark",
      });
      expect(result.availableThemes).toEqual(["dark", "light"]);
    });

    it("falls back to ['light'] when availableThemes is undefined", () => {
      const result = resolveThemingConfig({
        availableThemes: undefined,
        enabled: true,
        defaultTheme: "light",
      });
      expect(result.availableThemes).toEqual(["light"]);
    });

    it("falls back to ['light'] when availableThemes is empty array", () => {
      const result = resolveThemingConfig({
        availableThemes: [],
        enabled: true,
        defaultTheme: "light",
      });
      expect(result.availableThemes).toEqual(["light"]);
    });

    it("falls back to ['light'] when availableThemes contains only empty strings", () => {
      const result = resolveThemingConfig({
        availableThemes: ["", ""],
        enabled: true,
        defaultTheme: "light",
      });
      expect(result.availableThemes).toEqual(["light"]);
    });

    it("filters out empty strings from availableThemes", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "", "light", ""],
        enabled: true,
        defaultTheme: "dark",
      });
      expect(result.availableThemes).toEqual(["dark", "light"]);
    });

    it("deduplicates availableThemes", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "light", "dark", "light"],
        enabled: true,
        defaultTheme: "dark",
      });
      expect(result.availableThemes).toEqual(["dark", "light"]);
    });
  });

  describe("defaultTheme", () => {
    it("returns provided defaultTheme when valid", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark"],
        enabled: true,
        defaultTheme: "dark",
      });
      expect(result.defaultTheme).toBe("dark");
    });

    it("falls back to 'light' when defaultTheme is undefined and light is available", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "light"],
        enabled: true,
        defaultTheme: undefined,
      });
      expect(result.defaultTheme).toBe("light");
    });

    it("falls back to first available theme when defaultTheme is undefined and light is not available", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "folwell"],
        enabled: true,
        defaultTheme: undefined,
      });
      expect(result.defaultTheme).toBe("dark");
    });

    it("falls back to 'light' when defaultTheme is empty string and light is available", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "light"],
        enabled: true,
        defaultTheme: "",
      });
      expect(result.defaultTheme).toBe("light");
    });

    it("falls back to first available theme when defaultTheme is not in availableThemes", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "folwell"],
        enabled: true,
        defaultTheme: "hotdog",
      });
      expect(result.defaultTheme).toBe("dark");
    });

    it("keeps defaultTheme when it is in availableThemes", () => {
      const result = resolveThemingConfig({
        availableThemes: ["dark", "folwell"],
        enabled: true,
        defaultTheme: "folwell",
      });
      expect(result.defaultTheme).toBe("folwell");
    });
  });

  describe("enabled", () => {
    it("passes through enabled value", () => {
      expect(
        resolveThemingConfig({
          availableThemes: ["light"],
          enabled: true,
          defaultTheme: "light",
        }).enabled
      ).toBe(true);

      expect(
        resolveThemingConfig({
          availableThemes: ["light"],
          enabled: false,
          defaultTheme: "light",
        }).enabled
      ).toBe(false);
    });
  });
});
