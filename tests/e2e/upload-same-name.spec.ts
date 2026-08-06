import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
} from "../setup";

const SAVE_ROUTE = "**/assetManager/submission/**";

test.describe("two uploads sharing a filename", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId, username: "curator" });

    await page.goto("/assetManager/addAsset");
    await page.getByLabel("Template").selectOption({ label: "Some Fields" });
    await page.getByLabel("Collection").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue" }).click();
  });

  test("both files keep their own identity in the saved asset", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // the fileIds each save carries, one array per submission
    const savedFileIds: string[][] = [];
    await page.route(SAVE_ROUTE, async (route) => {
      const body = route.request().postData() ?? "";
      savedFileIds.push(
        [...body.matchAll(/"fileId":"([^"]+)"/g)].map((match) => match[1])
      );
      await route.continue();
    });

    await page.getByLabel(/title/i).first().fill("Same names");

    // two different files that happen to share a name, like photos from
    // two cameras
    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "browse files" }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles([
      {
        name: "IMG_0001.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("first file bytes"),
      },
      {
        name: "IMG_0001.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("second file bytes, a bit longer"),
      },
    ]);

    // each completed upload auto-saves. Wait for a save carrying both rows
    await expect
      .poll(() => savedFileIds.some((fileIds) => fileIds.length === 2), {
        timeout: 20000,
      })
      .toBe(true);

    const fileIdsOfBothRows = savedFileIds.find(
      (fileIds) => fileIds.length === 2
    );
    expect(new Set(fileIdsOfBothRows).size).toBe(2);
  });
});
