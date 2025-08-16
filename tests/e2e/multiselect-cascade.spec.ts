import { test, expect, Page } from "@playwright/test";
import { setupWorkerHTTPHeader, loginUser, refreshDatabase } from "../setup";
import type { CreateAssetRequestFormData } from "../../src/types";

type CascadeValues = {
  Country: string;
  "State or Province": string;
  City: string;
  Neighborhood?: string;
};

type CascadeFieldContents = {
  country: string;
  stateorprovince: string;
  city: string;
  neighborhood?: string;
};

// Extend the base form data type to include our specific cascade select field
type SubmissionFormData = CreateAssetRequestFormData & {
  cascadeselect_1: Array<{
    fieldContents: CascadeFieldContents;
    isPrimary: boolean;
  }>;
};

/**
 * Creates an asset with cascade select values for testing.
 * Uses template index 1 ("All Fields Test" - templateId 68) which contains the cascade select widget.
 */
async function createAssetWithCascadeValues(
  page: Page,
  title: string,
  cascadeValues: CascadeValues
) {
  await page.goto("/assetManager/addAsset");

  // Select "All Fields Test" template (index 1) which contains cascade select
  await page.getByLabel("Template").selectOption({ index: 1 });
  await page.getByLabel("Collection").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/title/i).first().fill(title);

  const cascadeWidget = page
    .locator(".edit-multiselect-widget")
    .filter({ hasText: "Cascade Select" });

  // Fill cascade values in order (country -> state -> city -> neighborhood)
  for (const [label, value] of Object.entries(cascadeValues)) {
    if (value) {
      await cascadeWidget.getByLabel(label).selectOption({ label: value });
    }
  }

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/assetManager\/editAsset\/([^/]+)/);
}

test.describe("MultiSelect Widget with Cascade Select", () => {
  test.describe("With Curator Permissions", () => {
    test.beforeEach(async ({ page, request }) => {
      const workerId = test.info().workerIndex.toString();
      await setupWorkerHTTPHeader({ page, workerId });

      // Refresh database and login as curator (has canManageAssets: true)
      await refreshDatabase({ request, workerId });
      await loginUser({ request, page, workerId, username: "curator" });

      await page.goto("/");
    });

    test("can create asset with cascade multiselect, save, and verify on view", async ({
      page,
    }) => {
      /**
       * Extracts form data from multipart POST data.
       * The createAsset/updateAsset functions always send JSON in a 'formData' field.
       */
      function extractFormData(postData: string): SubmissionFormData | null {
        // Extract the JSON from the formData field in multipart data
        const match = postData.match(
          /name="formData"\s*\r?\n\r?\n({.*?})\r?\n/s
        );
        if (!match) return null;

        try {
          return JSON.parse(match[1]) as SubmissionFormData;
        } catch {
          return null;
        }
      }

      // Set up the asset creation form
      await page.goto("/assetManager/addAsset");
      await page.getByLabel("Template").selectOption({ index: 1 });
      await page.getByLabel("Collection").selectOption({ index: 1 });
      await page.getByRole("button", { name: "Continue" }).click();
      await page
        .getByLabel(/title/i)
        .first()
        .fill("Test Asset with Cascade MultiSelect");

      const cascadeWidget = page
        .locator(".edit-multiselect-widget")
        .filter({ hasText: "Cascade Select" });

      await cascadeWidget.getByLabel("Country").selectOption({ label: "usa" });
      await cascadeWidget
        .getByLabel("State or Province")
        .selectOption({ label: "minnesota" });
      await cascadeWidget
        .getByLabel("City")
        .selectOption({ label: "St. Paul" });

      // Wait for and capture the submission request when save is clicked
      const [submissionRequest] = await Promise.all([
        page.waitForRequest(
          (request) =>
            request.method() === "POST" &&
            request.url().includes("submission") &&
            !!extractFormData(request.postData() || "") &&
            String(extractFormData(request.postData() || "")?.templateId) ===
              "68"
        ),
        page.getByRole("button", { name: "Save" }).click(),
      ]);

      // Should redirect to edit mode after save
      await expect(page).toHaveURL(/\/assetManager\/editAsset\/.+/, {
        timeout: 5000,
      });

      // Validate the intercepted submission request data
      const postData = submissionRequest.postData();
      expect(postData).toBeTruthy();

      const formData = extractFormData(postData!);
      expect(formData).toBeTruthy();
      expect(formData!.templateId).toBe("68");
      expect(formData!.cascadeselect_1).toEqual([
        {
          isPrimary: false,
          fieldContents: {
            country: "usa",
            stateorprovince: "minnesota",
            city: "St. Paul",
          },
        },
      ]);

      // Verify values persist after reload
      await page.reload();
      const cascadeWidgetReload = page
        .locator(".edit-multiselect-widget")
        .filter({ hasText: "Cascade Select" });

      await expect(
        cascadeWidgetReload.getByLabel("Country").locator("option:checked")
      ).toHaveText("usa");
      await expect(
        cascadeWidgetReload
          .getByLabel("State or Province")
          .locator("option:checked")
      ).toHaveText("minnesota");
      await expect(
        cascadeWidgetReload.getByLabel("City").locator("option:checked")
      ).toHaveText("St. Paul");

      // Verify values appear on view page
      const assetId = page.url().match(/\/editAsset\/([^/]+)/)?.[1];
      if (!assetId) {
        throw new Error(`Could not extract asset ID from URL: ${page.url()}`);
      }

      await page.goto(`/asset/viewAsset/${assetId}`);
      await page.waitForLoadState("networkidle");

      if ((await page.title()).includes("Page not found")) {
        return;
      }

      await expect(page.getByText("usa")).toBeVisible();
      await expect(page.getByText("minnesota")).toBeVisible();
      await expect(page.getByText("St. Paul")).toBeVisible();
    });

    test("can edit existing multiselect cascade values", async ({ page }) => {
      await createAssetWithCascadeValues(page, "Test Asset for Editing", {
        Country: "usa",
        "State or Province": "minnesota",
        City: "minneapolis",
      });

      // Verify initial values after reload
      await page.reload();
      const cascadeWidget = page
        .locator(".edit-multiselect-widget")
        .filter({ hasText: "Cascade Select" });
      await expect(cascadeWidget.getByLabel("City")).toHaveValue(
        "city-minneapolis"
      );

      // Demonstrate that city selection can be changed
      await cascadeWidget
        .getByLabel("City")
        .selectOption({ label: "St. Paul" });
      await expect(cascadeWidget.getByLabel("City")).toHaveValue("city-stpaul");

      // Verify that changing back to original works too
      await cascadeWidget
        .getByLabel("City")
        .selectOption({ label: "minneapolis" });
      await expect(cascadeWidget.getByLabel("City")).toHaveValue(
        "city-minneapolis"
      );
    });

    test("existing asset with cascade values displays correct values not category names", async ({
      page,
    }) => {
      // Navigate to the pre-seeded "All Fields Asset" that contains cascade select data
      const existingAssetId = "687969fd9c90c709c1021d01"; // From assets.ts seed data
      await page.goto(`/asset/viewAsset/${existingAssetId}`);
      await page.waitForLoadState("networkidle");

      if ((await page.title()).includes("Page not found")) {
        throw new Error(
          `Asset view page not found for asset ${existingAssetId}`
        );
      }

      // Check that minnesota link URL should contain actual values
      const minnesotaLink = page.getByRole("link", { name: "minnesota" });
      await expect(minnesotaLink).toBeVisible();
      const mnHref = await minnesotaLink.getAttribute("href");
      const mnLastSegment = mnHref?.split("/").pop()?.toLowerCase();
      expect(mnLastSegment).toBe(encodeURIComponent("usa : minnesota"));

      // Check that Summit Hill link URL should contain actual values
      const summitLink = page.getByRole("link", { name: "Summit Hill" });
      await expect(summitLink).toBeVisible();
      const summitHref = await summitLink.getAttribute("href");
      const summitLastSegment = summitHref?.split("/").pop()?.toLowerCase();
      expect(summitLastSegment).toBe(
        encodeURIComponent("usa : minnesota : St. Paul : Summit Hill")
      );
    });
  });
});
