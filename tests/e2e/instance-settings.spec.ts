import { test, expect } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";

test.describe("Instance Settings Page", () => {
  test.describe("With Admin Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "admin" });
    });

    test("loads and displays the instance settings form", async ({ page }) => {
      await page.goto("/instances/edit/1");

      await expect(
        page.getByRole("heading", { name: "Instance Settings" })
      ).toBeVisible();

      // General section fields
      await expect(page.getByLabel("Instance Name")).toBeVisible();
      await expect(page.getByLabel("Domain")).toBeVisible();

      // Sidebar actions
      await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    });

    test("pre-fills form with existing instance values", async ({ page }) => {
      await page.goto("/instances/edit/1");

      await expect(page.getByLabel("Instance Name")).toHaveValue(
        "defaultinstance"
      );
      await expect(page.getByLabel("Domain")).toHaveValue("example.edu");
    });

    test("shows unsaved changes indicator when form is modified", async ({
      page,
    }) => {
      await page.goto("/instances/edit/1");

      // No unsaved changes initially
      await expect(
        page.getByText("You have unsaved changes")
      ).not.toBeVisible();

      // Modify a field
      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("My Updated Instance");

      // Unsaved changes indicator should appear
      await expect(page.getByText("You have unsaved changes")).toBeVisible();
    });

    test("cancel button resets form to saved values", async ({ page }) => {
      await page.goto("/instances/edit/1");

      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("Modified Name");
      await expect(page.getByText("You have unsaved changes")).toBeVisible();

      await page.getByRole("button", { name: "Cancel" }).click();

      // Form should reset to the original value
      await expect(nameField).toHaveValue("defaultinstance");
      await expect(
        page.getByText("You have unsaved changes")
      ).not.toBeVisible();
    });

    test("can save updated instance name", async ({ page }) => {
      await page.goto("/instances/edit/1");

      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("My Renamed Instance");

      await page.getByRole("button", { name: "Save" }).click();

      // Toast should confirm success
      await expect(
        page.getByText("Instance settings saved successfully")
      ).toBeVisible();

      // Unsaved changes indicator should clear
      await expect(
        page.getByText("You have unsaved changes")
      ).not.toBeVisible();
    });

    test("persists saved changes after page reload", async ({ page }) => {
      await page.goto("/instances/edit/1");

      const nameField = page.getByLabel("Instance Name");
      await nameField.fill("Persisted Name");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("Instance settings saved successfully")
      ).toBeVisible();

      // Reload and verify value persisted
      await page.reload();
      await expect(page.getByLabel("Instance Name")).toHaveValue(
        "Persisted Name"
      );
    });

    test("persists custom CSS and applies it to instance nav settings on save", async ({
      page,
    }) => {
      const customCSS = "body { --e2e-custom-css: persisted; }";
      const customCSSVariableName = "--e2e-custom-css";

      await page.goto("/instances/edit/1");

      await page.getByRole("switch", { name: "Use Custom CSS" }).click();
      await expect(
        page.getByRole("switch", { name: "Use Custom CSS" })
      ).toHaveAttribute("aria-checked", "true");
      await page.getByLabel("Custom CSS").fill(customCSS);

      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("Instance settings saved successfully")
      ).toBeVisible();

      await page.reload();

      await expect(
        page.getByRole("switch", { name: "Use Custom CSS" })
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("Custom CSS")).toHaveValue(customCSS);

      // toHaveText uses innerText, which is empty for <head> elements — check textContent directly
      const styleContent = await page.evaluate(
        () => document.getElementById("elevator-custom-css")?.textContent ?? ""
      );
      expect(styleContent).toBe(customCSS);
      await expect
        .poll(async () =>
          page.evaluate((cssVariableName) => {
            return getComputedStyle(document.body)
              .getPropertyValue(cssVariableName)
              .trim();
          }, customCSSVariableName)
        )
        .toBe("persisted");
    });

    test("all form fields persist after save and reload", async ({ page }) => {
      await page.goto("/instances/edit/1");

      // --- General ---
      await page.getByLabel("Instance Name").fill("Updated Instance");
      await page.getByLabel("Domain").fill("updated.example.edu");
      await page.getByLabel("Owner Contact").fill("mailto:owner@example.edu");
      await page.getByLabel("Instance Notes").fill("Internal notes here");
      // "Use Central Authentication" starts on — toggle it off

      await page
        .getByRole("switch", { name: "Use Central Authentication" })
        .click();
      await expect(
        page.getByRole("switch", { name: "Use Central Authentication" })
      ).toHaveAttribute("aria-checked", "false");

      // --- Customization ---
      await page.getByLabel("Custom Home Redirect").fill("/new-home");
      await page.getByLabel("Google Analytics Key").fill("G-12345678");
      await page.getByLabel("Display Custom Header/Footer").selectOption("1"); // Always
      await page.getByLabel("Custom Header Content").fill("<b>Header</b>");
      await page.getByLabel("Custom Footer Content").fill("<p>Footer</p>");

      // Enable Custom CSS, then fill the revealed textarea
      await page.getByRole("switch", { name: "Use Custom CSS" }).click();
      await expect(
        page.getByRole("switch", { name: "Use Custom CSS" })
      ).toHaveAttribute("aria-checked", "true");
      await page.getByLabel("Custom CSS").fill("body { color: red; }");

      // --- Storage ---
      await page.getByLabel("Amazon S3 Key").fill("AKIAIOSFODNN7EXAMPLE");
      await page.getByLabel("Amazon S3 Secret").fill("wJalrXUtnFEMI");
      await page.getByLabel("Default Bucket").fill("my-s3-bucket");
      await page.getByLabel("Bucket Region").fill("us-east-1");

      // --- Featured Asset ---
      await page.getByLabel("Featured Asset ID").fill("abc123");
      await page.getByLabel("Featured Asset Text").fill("Check out this asset");

      // --- Search ---
      // All start on — toggle them off
      await page
        .getByRole("switch", { name: "Show Collection in Search Results" })
        .click();
      await expect(
        page.getByRole("switch", {
          name: "Show Collection in Search Results",
        })
      ).toHaveAttribute("aria-checked", "false");

      await page
        .getByRole("switch", { name: "Show Template in Search Results" })
        .click();
      await expect(
        page.getByRole("switch", { name: "Show Template in Search Results" })
      ).toHaveAttribute("aria-checked", "false");

      await page
        .getByRole("switch", { name: "Allow Search Engine Indexing" })
        .click();
      await expect(
        page.getByRole("switch", { name: "Allow Search Engine Indexing" })
      ).toHaveAttribute("aria-checked", "false");

      // Autoload starts off — toggle it on
      await expect(
        page.getByRole("switch", {
          name: "Autoload Search Results (under 1000)",
        })
      ).toHaveAttribute("aria-checked", "false");
      await page
        .getByRole("switch", { name: "Autoload Search Results (under 1000)" })
        .click();

      // --- Assets ---
      // Enable interstitial to reveal text field (starts off)

      await page
        .getByRole("switch", {
          name: "Show Interstitial When Embedding via API",
        })
        .click();
      await expect(
        page.getByRole("switch", {
          name: "Show Interstitial When Embedding via API",
        })
      ).toHaveAttribute("aria-checked", "true");
      await page
        .getByLabel("Interstitial Text")
        .fill("Please read before embedding.");

      await page
        .getByRole("switch", { name: "Show Previous/Next in Asset View" })
        .click(); // off
      await expect(
        page.getByRole("switch", {
          name: "Show Previous/Next in Asset View",
        })
      ).toHaveAttribute("aria-checked", "false");

      await page
        .getByRole("switch", { name: "Hide Video/Audio Download Links" })
        .click(); // on
      await expect(
        page.getByRole("switch", {
          name: "Hide Video/Audio Download Links",
        })
      ).toHaveAttribute("aria-checked", "true");

      await page
        .getByRole("switch", { name: "Auto-generate Alt Text and Captions" })
        .click(); // off
      await expect(
        page.getByRole("switch", {
          name: "Auto-generate Alt Text and Captions",
        })
      ).toHaveAttribute("aria-checked", "false");

      await page
        .getByRole("switch", { name: "Use Smithsonian Voyager for 3D" })
        .click(); // off
      await expect(
        page.getByRole("switch", {
          name: "Use Smithsonian Voyager for 3D",
        })
      ).toHaveAttribute("aria-checked", "false");

      await page.getByRole("switch", { name: "Enable HLS Streaming" }).click(); // on
      await expect(
        page.getByRole("switch", { name: "Enable HLS Streaming" })
      ).toHaveAttribute("aria-checked", "true");

      await page.getByLabel("More Like This Results").fill("5");
      await page.getByLabel("Text Area Collapsed Height (px)").fill("200");

      // --- User Interface ---
      // Interface version is already 1 (VueJS) — enable theming (starts off)
      await page
        .getByRole("switch", { name: "Enable Theme Selection" })
        .click();
      await expect(
        page.getByRole("switch", { name: "Enable Theme Selection" })
      ).toHaveAttribute("aria-checked", "true");

      await page.getByLabel("Default Theme").selectOption("dark");

      // Uncheck "folwell" from available themes
      await page.getByRole("checkbox", { name: "folwell" }).uncheck();

      await page.getByRole("button", { name: "Save" }).click();

      await expect(
        page.getByText("Instance settings saved successfully")
      ).toBeVisible();

      await page.reload();

      // Verify all fields persisted
      await expect(page.getByLabel("Instance Name")).toHaveValue(
        "Updated Instance"
      );
      await expect(page.getByLabel("Domain")).toHaveValue(
        "updated.example.edu"
      );
      await expect(page.getByLabel("Owner Contact")).toHaveValue(
        "mailto:owner@example.edu"
      );
      await expect(page.getByLabel("Instance Notes")).toHaveValue(
        "Internal notes here"
      );
      await expect(
        page.getByRole("switch", { name: "Use Central Authentication" })
      ).toHaveAttribute("aria-checked", "false");

      await expect(page.getByLabel("Custom Home Redirect")).toHaveValue(
        "/new-home"
      );
      await expect(page.getByLabel("Google Analytics Key")).toHaveValue(
        "G-12345678"
      );
      await expect(page.getByLabel("Display Custom Header/Footer")).toHaveValue(
        "1"
      );
      await expect(page.getByLabel("Custom Header Content")).toHaveValue(
        "<b>Header</b>"
      );
      await expect(page.getByLabel("Custom Footer Content")).toHaveValue(
        "<p>Footer</p>"
      );
      await expect(
        page.getByRole("switch", { name: "Use Custom CSS" })
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("Custom CSS")).toHaveValue(
        "body { color: red; }"
      );

      await expect(page.getByLabel("Amazon S3 Key")).toHaveValue(
        "AKIAIOSFODNN7EXAMPLE"
      );
      await expect(page.getByLabel("Default Bucket")).toHaveValue(
        "my-s3-bucket"
      );
      await expect(page.getByLabel("Bucket Region")).toHaveValue("us-east-1");

      await expect(page.getByLabel("Featured Asset ID")).toHaveValue("abc123");
      await expect(page.getByLabel("Featured Asset Text")).toHaveValue(
        "Check out this asset"
      );

      await expect(
        page.getByRole("switch", { name: "Show Collection in Search Results" })
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        page.getByRole("switch", { name: "Show Template in Search Results" })
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        page.getByRole("switch", { name: "Allow Search Engine Indexing" })
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        page.getByRole("switch", {
          name: "Autoload Search Results (under 1000)",
        })
      ).toHaveAttribute("aria-checked", "true");

      await expect(
        page.getByRole("switch", {
          name: "Show Interstitial When Embedding via API",
        })
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("Interstitial Text")).toHaveValue(
        "Please read before embedding."
      );
      await expect(
        page.getByRole("switch", { name: "Show Previous/Next in Asset View" })
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        page.getByRole("switch", { name: "Hide Video/Audio Download Links" })
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByRole("switch", {
          name: "Auto-generate Alt Text and Captions",
        })
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        page.getByRole("switch", { name: "Use Smithsonian Voyager for 3D" })
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        page.getByRole("switch", { name: "Enable HLS Streaming" })
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("More Like This Results")).toHaveValue("5");
      await expect(
        page.getByLabel("Text Area Collapsed Height (px)")
      ).toHaveValue("200");

      await expect(
        page.getByRole("switch", { name: "Enable Theme Selection" })
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("Default Theme")).toHaveValue("dark");
      await expect(
        page.getByRole("checkbox", { name: "folwell" })
      ).not.toBeChecked();
    });

    test("table of contents links scroll to the correct sections", async ({
      page,
    }) => {
      await page.goto("/instances/edit/1");

      // TOC is visible on large screens (the test viewport is typically wide enough)
      const storageLink = page.locator("a", { hasText: "Storage" }).first();
      if (await storageLink.isVisible()) {
        await storageLink.click();
        await expect(
          page.getByRole("heading", { name: "Storage" })
        ).toBeInViewport();
      }
    });
  });

  test.describe("Without Admin Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "user" });
    });

    test("shows an error state when a non-admin accesses the page", async ({
      page,
    }) => {
      await page.goto("/instances/edit/1");

      // The API returns 403, so the page should show its error state
      await expect(
        page.getByText("Failed to load instance settings")
      ).toBeVisible();

      // The form should not be rendered
      await expect(page.getByLabel("Instance Name")).not.toBeVisible();
    });
  });
});
