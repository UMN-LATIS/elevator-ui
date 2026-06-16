import { test, expect } from "@playwright/test";
import {
  setupWorkerHTTPHeader,
  loginUser,
  refreshDatabase,
  createMismatchedSearch,
} from "../setup";

test.describe("Search Result Count Mismatch (#451)", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await loginUser({ request, page, workerId });
  });

  test("single-page: adjusts totalResults when actual matches are fewer", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    // "Asset 9" matches: Asset 9, Asset 90–99 = 11 results (single page)
    // Inflate totalResults to 15 so the UI thinks there are more
    const search = await createMismatchedSearch({
      request,
      workerId,
      query: "Asset 9",
      totalResultsOverride: 15,
    });

    await page.goto(`/defaultinstance/search/s/${search.searchId}`);

    // Wait for results to render
    await expect(page.locator(".search-result-card").first()).toBeVisible();

    // The inflated totalResults makes the UI show "Load All" (showingCount < total)
    const loadButton = page
      .getByRole("button", { name: /Load All/i })
      .first();
    await expect(loadButton).toBeVisible();

    // Click "Load All" and wait for the API response — should return 0 matches
    // since all real results already fit on page 0
    const loadAllResponsePromise = page.waitForResponse((res) =>
      res.url().includes(`/searchResults/${search.searchId}/1/true`)
    );
    await loadButton.click();

    const loadAllResponse = await loadAllResponsePromise;
    const loadAllBody = await loadAllResponse.json();
    expect(loadAllBody.matches).toHaveLength(0);

    // No error notification should appear
    await expect(
      page.locator(".search-results-page__search-error-notification")
    ).not.toBeVisible();

    // After the empty page is detected, totalResults should be adjusted
    // so the "Load All"/"Load More" button disappears (showingCount === total).
    await expect(loadButton).not.toBeVisible();
  });

  test("paginated: adjusts totalResults when final page returns fewer results than expected", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    // inflate the total results
    const search = await createMismatchedSearch({
      request,
      workerId,
      query: "",
      totalResultsOverride: 200,
    });

    await page.goto(`/defaultinstance/search/s/${search.searchId}`);

    // Wait for first page of results to render
    await expect(page.locator(".search-result-card").first()).toBeVisible();

    // Click "Load All" and wait for the loadAll API response to complete
    const loadAllResponsePromise = page.waitForResponse((res) =>
      res.url().includes(`/searchResults/${search.searchId}/1/true`)
    );

    const loadButton = page
      .getByRole("button", { name: /Load All/i })
      .first();
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    const loadAllResponse = await loadAllResponsePromise;
    const loadAllBody = await loadAllResponse.json();
    expect(loadAllBody.matches.length).toBeGreaterThan(0);

    // No error notification should appear
    await expect(
      page.locator(".search-results-page__search-error-notification")
    ).not.toBeVisible();

    // The results count should show matching numbers.
    // Both <b> tags inside the results-count <p> should contain the same number.
    const countsText = await page
      .locator(".results-count p")
      .first()
      .innerText();
    const counts = countsText.match(/(\d+)/g);
    expect(counts).not.toBeNull();
    expect(counts!.length).toBeGreaterThanOrEqual(2);
    expect(counts![0]).toEqual(counts![1]);
  });

  test("back navigation: does not duplicate results or reset adjusted totalResults", async ({
    page,
    request,
  }) => {
    const workerId = test.info().workerIndex.toString();

    const search = await createMismatchedSearch({
      request,
      workerId,
      query: "",
      totalResultsOverride: 200,
    });

    await page.goto(`/defaultinstance/search/s/${search.searchId}`);

    // Wait for first page, then load all
    await expect(page.locator(".search-result-card").first()).toBeVisible();

    const loadAllResponsePromise = page.waitForResponse((res) =>
      res.url().includes(`/searchResults/${search.searchId}/1/true`)
    );
    await page.getByRole("button", { name: /Load All/i }).first().click();
    await loadAllResponsePromise;

    // Record the actual result count after loading
    const countsTextBefore = await page
      .locator(".results-count p")
      .first()
      .innerText();
    const countsBefore = countsTextBefore.match(/(\d+)/g)!;
    const resultCountBefore = countsBefore[0];

    // Click a search result to navigate away
    await page.locator(".search-result-card").first().click();
    await expect(page).not.toHaveURL(/\/search\/s\//);

    // Hit browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/search\/s\//);
    await expect(page.locator(".search-result-card").first()).toBeVisible();

    // Wait for any post-navigation loading to settle
    await page.waitForTimeout(1000);

    // The result count should match what we had before navigating away
    const countsTextAfter = await page
      .locator(".results-count p")
      .first()
      .innerText();
    const countsAfter = countsTextAfter.match(/(\d+)/g)!;

    // Both numbers should match (no inflated total, no duplicates)
    expect(countsAfter[0]).toEqual(countsAfter[1]);
    // And the loaded count should be the same as before navigation
    expect(countsAfter[0]).toEqual(resultCountBefore);
  });
});
